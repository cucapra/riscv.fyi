// This script loads RISC-V instruction YAML files from the Unified Database,
// extracts encoding information (match bits + variable positions), and
// generates compact bitfield layouts for visualization using `bit-field`.


import render from "bit-field/lib/render.js";
import * as yaml from "js-yaml";
import * as onml from "onml";
import * as path from "path";
import * as fs from "fs";


const INST_ROOT = path.join(process.cwd(), "riscv-unified-db", "spec", "std", "isa", "inst");
let cache: InstructionInfo[] | null = null;


function readYamlFile(p: string): YamlDoc {
    const txt = fs.readFileSync(p, "utf8");
    return yaml.load(txt) as YamlDoc;
}


/*
Parse a match bit string (e.g., "0100000----------101-----0010011")
into an array of single characters, each representing one bit.
Returns null if the string isn’t 16 or 32 bits long.
*/
function parseMatchBits(matchStr: string): string[] {
    if (matchStr.length !== 16 && matchStr.length !== 32)
        throw new Error(`Invalid match string length ${matchStr.length}; expected 16 or 32`);
    return matchStr.split("");
}


/*
Parse a bitfield location string into numeric segments.
Example: "31-25|11-7" → [ {from:31,to:25}, {from:11,to:7} ]

Each segment defines one contiguous region of bits, and fields can have
multiple disjoint segments (like immediates in S- or B-type instructions).
If no low end is provided (e.g., "31" or "31-"), it’s treated as a single-bit.
*/
function parseLocationSegments(loc: string | number): Segment[] {
    return String(loc)
        .split("|")
        .map((part) => part.trim())
        .map((part) => {
            const [hiStr, loStr] = part.split("-").map((n) => n.trim());
            const hi = parseInt(hiStr);
            const lo = loStr !== undefined && loStr !== "" ? parseInt(loStr) : hi;
            return { from: hi, to: lo };
        });
}


/*
Extract all variable and constant fields from an instruction definition.
This function handles both flat encodings and multi-variant encodings
(e.g., RV32 / RV64). It returns an array of field descriptors like:

[
    { label: "funct7=0100000", from: 31, to: 25, width: 7, kind: "const" },
    { label: "rs2", from: 24, to: 20, width: 5, kind: "var" },
    ...
]

These field objects describe what appears at each bit position. The `kind`
property indicates whether the field is a variable (part of the instruction
encoding) or a constant (fixed bits defined by the match pattern). Segments are
included for multi-segment fields such as when the location is non-contiguous.
*/
function computeFields(doc: YamlDoc): Field[] {
    // Encodings may be a flat object with match string/variables or
    // a map of variants (e.g., { RV32: {...}, RV64: {...} });
    const fields: Field[] = [];
    if (!doc.encoding) return fields;
    let enc = doc.encoding;

    if (!enc.match && !enc.variables) {
        const variants = Object.keys(enc); // e.g., ["RV32", "RV64"]
        const chosenKey = variants.includes("RV32") ? "RV32" : variants[0];
        enc = enc[chosenKey] as EncodingDoc;
    }

    const match = enc.match ? parseMatchBits(enc.match) : null;
    const vars = Array.isArray(enc.variables) ? enc.variables : [];

    // --- Parse variable fields (e.g., rd, rs1, imm) ---
    for (const v of vars) {
        const segments = parseLocationSegments(v.location); // Not all variables have multiple locations
        const sorted = [...segments].sort((a, b) => b.from - a.from || b.to - a.to); // MSB->LSB order
        for (let i = 1; i < sorted.length; i++) { // Ensure segments don't overlap
            const prev = sorted[i - 1];
            const curr = sorted[i];
            const overlaps = Math.max(prev.to, curr.to) <= Math.min(prev.from, curr.from);
            if (overlaps) throw new Error(`Overlapping segments for ${v.name}: ${JSON.stringify(segments)}`);
        }

        // Find the overall high/low bits and width
        const from = Math.max(...segments.map((s) => s.from));
        const to = Math.min(...segments.map((s) => s.to));
        const width = segments.reduce((sum, s) => sum + (s.from - s.to + 1), 0);
        fields.push({ label: v.name, from, to, width, kind: "var", segments });
    }

    // --- Parse constant bit regions from the match pattern (fixed 0/1, not "-") ---
    if (match) {
        for (let bit = match.length - 1; bit >= 0; bit--) {
            if (match[match.length - 1 - bit] === "-") continue;

            const hi = bit;
            while (bit >= 0 && match[match.length - 1 - bit] !== "-") bit--;
            const lo = bit + 1;
            const width = hi - lo + 1;
            const bits = match.slice(match.length - 1 - hi, match.length - lo).join("");

            // Label common constant fields if their positions match
            let label = bits;
            if (hi === 31 && lo === 25) label = `funct7=${bits}`;
            else if (hi === 14 && lo === 12) label = `funct3=${bits}`;
            else if (hi === 6 && lo === 0) label = `opcode=${bits}`;
            else label = `const=${bits}`;
            fields.push({ label, from: hi, to: lo, width, kind: "const" });
        }
    }

    fields.sort((a, b) => b.from - a.from); // MSB→LSB order
    return fields;
}


// Match common instruction formats (I, S, R) based on their variable field positions.
function detectEncodingType(doc: YamlDoc) {
    if (!doc.encoding || !Array.isArray(doc.encoding.variables)) return undefined;
    const vars = Object.fromEntries(doc.encoding.variables.map((v) => [v.name, String(v.location)]));
    const eq = (name: string, hi: number, lo: number) => vars[name] === hi + "-" + lo;

    if (eq("xd", 11, 7) && eq("xs1", 19, 15) && eq("imm", 31, 20)) return "I";
    if (eq("xd", 11, 7) && eq("xs1", 19, 15) && eq("xs2", 24, 20)) return "R";
    if (eq("xs2", 24, 20) && eq("xs1", 19, 15) && eq("imm", 11, 7)) return "S";
    if (eq("imm", 31, 12) && eq("xd", 11, 7)) return "U";
    if (eq("imm", 31, 12) && eq("xs1", 19, 15)) return "J";
    if (eq("xs2", 24, 20) && eq("xs1", 19, 15) && eq("imm", 11, 7)) return "B";
    return undefined;
}


/*
Enrich pseudo-instruction entries for display:
- Builds `resolvedSyntax` by substituting the simple `name == value` pairs from
the `when` condition into the real instruction syntax.
- Complex expressions (e.g. $signed(imm) == -1, imm[4:0] == 0) are left unreplaced.
*/
function preprocessPseudoInstructions(
    pseudos: { when: string; to: string }[],
    syntax: string,
): PseudoInstruction[] {
    return pseudos.map(({ when, to }) => {
        const normalizedTo = to.replace(/,(?!\s)/g, ", ");
        let resolvedSyntax = syntax;

        // Extract simple `identifier == value` pairs; skip complex left-hand sides
        const assignments = [...when.matchAll(/\b([a-zA-Z_]\w*)\s*==\s*([^\s)&|,\]]+)/g)];
        for (const [, name, value] of assignments) {
            resolvedSyntax = resolvedSyntax.replace(new RegExp(`\\b${name}\\b`, "g"), value);
        }
        return { when: when, to: normalizedTo, resolvedSyntax };
    });
}


// Normalize the "definedBy" field into a consistent string format for display.
function normalizeDefinedBy(value: unknown, fallback: string): string {
    if (!value) return fallback;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        if (Array.isArray(obj.anyOf)) return obj.anyOf.join(" or ");
        if (Array.isArray(obj.allOf)) return obj.allOf.join(" and ");
        if (typeof obj.name === "string") return obj.name;
    }
    return fallback;
}


// Convert an extension name into a URL-friendly slug
function slugifyExtension(ext: string): string {
    return (
        ext.toString().trim()
            .replace(/[^A-Za-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "unknown"
    );
}


/*
Example of expanding multi-segment fields into individual contiguous entries.

Before expansion: fields = [
    { label: "imm", from: 31, to: 7, segments: [ { from: 31, to: 25 }, { from: 11, to: 7 } ] },
]

After expansion: expanded_fields = [
    { label: "imm", from: 31, to: 25 },
    { label: "imm", from: 11, to: 7 }
]

This ensures that each disjoint bit range (like imm[31:25] and imm[11:7])
is rendered as its own segment in the bitfield diagram rather than one
continuous bar spanning bits 31–7.
*/
function expandBitfieldFields(fields: Field[], totalBits = 32): Field[] {
    const expanded: Field[] = [];
    for (const field of fields) {
        const segments = Array.isArray(field.segments) && field.segments.length
            ? field.segments // Fall back to [from..to] so contiguous fields still render
            : [{ from: field.from, to: field.to }];

        for (const seg of segments) {
            const width = seg.from - seg.to + 1;
            const label = field.label;
            expanded.push({ label, from: seg.from, to: seg.to, width, kind: field.kind });
        }
    }
    expanded.sort((a, b) => b.from - a.from);
    return expanded;
}


export default function loadInstructions(): InstructionInfo[] {
    if (cache) return cache;
    if (!fs.existsSync(INST_ROOT)) {
        console.warn("UDB instruction directory not found:", INST_ROOT);
        cache = [];
        return cache;
    }

    const instructions: InstructionInfo[] = [];
    const entries = fs.readdirSync(INST_ROOT, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const extension = entry.name;
        const extDir = path.join(INST_ROOT, extension);
        const files = fs.readdirSync(extDir).filter((fileName) => fileName.endsWith(".yaml"));

        for (const fileName of files) {
            const doc = readYamlFile(path.join(extDir, fileName));
            const assemblyArgs = typeof doc.assembly === "string" ? doc.assembly
                : Array.isArray(doc.assembly) ? doc.assembly.join(", ") : "";
            const fields = computeFields(doc);
            const encType = detectEncodingType(doc);

            let opcode, funct3, funct7;
            if (doc.encoding && doc.encoding.match) {
                const m = parseMatchBits(doc.encoding.match);
                if (m) {
                    const sliceBits = (hi: number, lo: number) => m.slice(31 - hi, 32 - lo).join("");
                    opcode = sliceBits(6, 0);
                    funct3 = sliceBits(14, 12);
                    const f7 = sliceBits(31, 25);
                    funct7 = /^[01]{7}$/.test(f7) ? f7 : undefined;
                }
            }

            const totalBits = doc.encoding?.match?.length === 16 ? 16 : 32;
            const filledFields = expandBitfieldFields(fields, totalBits);
            const bitfieldJSON = {
                reg: filledFields.map((f) => {
                    let name = f.label;
                    if (f.kind === "const") { // Remove labels like funct7 from "funct7=0000000 "
                        const idx = name.indexOf("=");
                        if (idx !== -1 && idx + 1 < name.length) name = name.slice(idx + 1);
                    }
                    return { name, bits: f.width, };
                }),
            };

            let bitfieldSVG = "";
            try {
                const segments = bitfieldJSON.reg.slice().reverse();
                const jsonml = render(segments, {
                    bits: totalBits,
                    vflip: false,
                    lanes: 1,
                    hspace: 800,
                }); // MSB→LSB order
                bitfieldSVG = onml.stringify(jsonml);
            } catch (err) { console.warn(`Failed to render SVG for ${doc.name}:`, err); }

            instructions.push({
                name: doc.name,
                longName: doc.long_name || doc.name,
                description: doc.description || "",
                definedBy: normalizeDefinedBy(doc.definedBy, extension),
                definedByRaw: doc.definedBy,
                base: doc.base || 32,
                syntax: (doc.name + " " + assemblyArgs).trim(),
                encodingType: encType,
                encoding: {
                    match: doc.encoding?.match || null,
                    variables: doc.encoding?.variables || [],
                    fields, opcode, funct3, funct7,
                },
                extensionSlug: slugifyExtension(extension),
                extension, bitfieldSVG,
                pseudoinstructions: preprocessPseudoInstructions(
                    doc.pseudoinstructions ?? [],
                    (doc.name + " " + assemblyArgs).trim(),
                ),
            });
        }
    }

    // Sort instructions first by extension, then alphabetically by name within each extension.
    instructions.sort((a, b) => {
        const extDiff = a.extension.localeCompare(b.extension);
        if (extDiff !== 0) return extDiff;
        return a.name.localeCompare(b.name);
    });

    cache = instructions;
    return cache;
}
