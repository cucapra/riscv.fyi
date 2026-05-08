import loadInstructions from "../lib/loadInstructions.js";

const missing = loadInstructions().filter((inst) => inst.encoding.fields.length === 0);

console.log(`${missing.length} instructions missing encoding:\n`);
for (const inst of missing) {
    console.log(`  ${inst.extension.padEnd(20)} ${inst.name}`);
}