import loadInstructions from "./loadInstructions.js";
import loadPseudoInstructions from "./loadPseudoInstructions.js";

import * as yaml from "js-yaml";
import * as path from "path";
import * as fs from "fs";


const EXT_ROOT = path.join(process.cwd(), "riscv-unified-db", "spec", "std", "isa", "ext");

interface ExtYaml {
    name?: string;
    long_name?: string;
}


// Override DB descriptions for specific extensions. These take precedence over
// whatever long_name is in the unified database. Used for better (or less
// confusing) display names
const DESCRIPTION_OVERRIDES: Record<string, string> = {
    B: "Bit Manipulation Instructions",
    I: "Base Integer ISA",
};


/*
Read all extension YAML files from the unified database and return a map of
extension name → long name. Entries with no name or long_name are skipped,
as is the Xmock test entry. Long names are title-cased for display. Any entry
in DESCRIPTION_OVERRIDES takes precedence over the DB value.
*/
function loadExtensionDescriptions(): Map<string, string> {
    const descriptions = new Map<string, string>();
    if (!fs.existsSync(EXT_ROOT)) {
        console.warn("UDB extension directory not found:", EXT_ROOT);
        return descriptions;
    }

    for (const file of fs.readdirSync(EXT_ROOT)) {
        if (!file.endsWith(".yaml")) continue;
        const doc = yaml.load(fs.readFileSync(path.join(EXT_ROOT, file), "utf8")) as ExtYaml;
        if (!doc.name || !doc.long_name || doc.name === "Xmock") continue;
        const normalized = doc.long_name.split(" ")
            .map((word) => word.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("-"))
            .join(" ");
        descriptions.set(doc.name, normalized);
    }

    for (const [name, desc] of Object.entries(DESCRIPTION_OVERRIDES)) {
        descriptions.set(name, desc);
    }
    return descriptions;
}


// Currently only extensions with at least one instruction are included in the output,
// even though the extensionDescriptions map contains a lot more entries that are currently
// unused. To include these extensions, either find a way to associate them with an instruction,
// or add a separate step to include them in the output list.
export default (): ExtensionInfo[] => {
    const instructions: InstructionInfo[] = loadInstructions();
    const pseudoInstructions: PseudoInstructionInfo[] = loadPseudoInstructions();
    const extensionDescriptions = loadExtensionDescriptions();
    const byExtension = new Map<string, ExtensionInfo>();

    // Group instructions by their extension and create ExtensionInfo objects
    for (const inst of instructions) {
        const name = inst.extension || "unknown";
        const slug = inst.extensionSlug || "unknown";
        if (slug === "unknown") {
            console.warn(`Instruction ${inst.name} has no extension slug, using "unknown"`);
        }

        if (!byExtension.has(name)) {
            byExtension.set(name, {
                name, slug,
                description: extensionDescriptions.get(name) ?? null,
                instructions: [], pseudoInstructions: [], sortedEntries: [],
                count: 0, pseudoCount: 0,
            });
        }
        byExtension.get(name)!.instructions.push(inst);
    }

    // Group pseudo-instructions by extension
    for (const pseudo of pseudoInstructions) {
        byExtension.get(pseudo.extension)?.pseudoInstructions.push(pseudo);
    }

    // Sort instructions and pseudo-instructions within each extension, and create sortedEntries
    const list = Array.from(byExtension.values());
    for (const entry of list) {
        entry.instructions.sort((a, b) => a.name.localeCompare(b.name));
        entry.count = entry.instructions.length;
        entry.pseudoInstructions.sort((a, b) => a.mnemonic.localeCompare(b.mnemonic));
        entry.pseudoCount = entry.pseudoInstructions.length;

        const realEntries: ExtensionListEntry[] = entry.instructions.map((inst) => ({
            name: inst.name,
            url: `/${inst.extensionSlug}/${inst.name}/`,
            label: inst.longName,
            isPseudo: false,
            base: inst.base,
        }));
        const pseudoEntries: ExtensionListEntry[] = entry.pseudoInstructions.map((p) => ({
            name: p.mnemonic,
            url: `/${p.extensionSlug}/${p.realInstName}/`,
            label: `Pseudo-Instruction (→ ${p.realInstName})`,
            isPseudo: true,
            base: 32, // Default to 32-bit, but not used
        }));
        entry.sortedEntries = [...realEntries, ...pseudoEntries]
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Sort extensions alphabetically by name
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
};
