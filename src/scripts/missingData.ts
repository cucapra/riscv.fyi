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
    "instructions missing encoding (empty ENCODING section on instruction page)",
    instructions
        .filter((inst) => inst.encoding.fields.length === 0)
        .map((inst) => `${inst.extension.padEnd(20)} ${inst.name}`),
);

report(
    "instructions missing description (empty section right below NAME on instruction page)",
    instructions
        .filter((inst) => !inst.description)
        .map((inst) => `${inst.extension.padEnd(20)} ${inst.name}`),
);


report(
    "instructions missing encoding type (empty TYPE field on instruction page)",
    instructions
        .filter((inst) => inst.encoding.fields.length > 0 && !inst.encodingType)
        .map((inst) => `${inst.extension.padEnd(20)} ${inst.name}`),
);


report(
    "extensions missing description (empty section right below NAME on extension page)",
    extensions
        .filter((ext) => !ext.description)
        .map((ext) => ext.name),
);


report(
    "at least one instruction missing label (empty LABEL field on extension page)",
    extensions
        .filter((ext) => ext.sortedEntries.some((entry) => !entry.label))
        .map((ext) => ext.name),
);
