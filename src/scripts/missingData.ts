// Run with npx tsx src/scripts/missingData.ts
import loadInstructions from "../lib/loadInstructions.js";
import loadExtensions from "../lib/loadExtensions.js";

function report(title: string, rows: string[]) {
    console.log(`${rows.length} ${title}:\n`);
    for (const row of rows) console.log(`  ${row}`);
    console.log();
}

const instructions = loadInstructions();
const extensions = loadExtensions();

report(
    "instructions missing encoding (empty ENCODING section on INSTRUCTION PAGE)",
    instructions
        .filter((inst) => inst.encoding.fields.length === 0)
        .map((inst) => `${inst.extension.padEnd(20)} ${inst.name}`),
);

report(
    "instructions missing description (empty section right below NAME on INSTRUCTION PAGE)",
    instructions
        .filter((inst) => !inst.description)
        .map((inst) => `${inst.extension.padEnd(20)} ${inst.name}`),
);


report(
    "instructions missing encoding type (empty TYPE field on INSTRUCTION PAGE)",
    instructions
        .filter((inst) => inst.encoding.fields.length > 0 && !inst.encodingType)
        .map((inst) => `${inst.extension.padEnd(20)} ${inst.name}`),
);


report(
    "extensions missing description (empty DESCRIPTION field on INDEX PAGE)",
    extensions
        .filter((ext) => !ext.description)
        .map((ext) => ext.name),
);


report(
    "at least one instruction missing label (empty LABEL field on EXTENSION PAGE)",
    extensions
        .filter((ext) => ext.sortedEntries.some((entry) => !entry.label))
        .map((ext) => ext.name),
);


report(
    "instructions with encoding fields but no match string (OPCODE/FUNCT3/FUNCT7 not extracted — common with RV32/RV64 variant encodings)",
    instructions
        .filter((inst) => inst.encoding.fields.length > 0 && !inst.encoding.match)
        .map((inst) => `${inst.extension.padEnd(20)} ${inst.name}`),
);


report(
    "instructions with malformed pseudo-instruction entries (missing WHEN or TO field)",
    instructions
        .filter((inst) => inst.pseudoinstructions.some((p) => !p.when || !p.to))
        .map((inst) => `${inst.extension.padEnd(20)} ${inst.name}`),
);


report(
    "instructions with garbled 'defined by' (shows [object Object] in EXTENSION field on INSTRUCTION PAGE)",
    instructions
        .filter((inst) => inst.definedBy.includes("[object"))
        .map((inst) => `${inst.extension.padEnd(20)} ${inst.name}`),
);
