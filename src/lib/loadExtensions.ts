import { extensionDescriptions } from "./hardcodedData.js";
import loadInstructions from "./loadInstructions.js";


export default (): ExtensionInfo[] => {
    const instructions: InstructionInfo[] = loadInstructions();
    const byExtension = new Map<string, ExtensionInfo>();

    // Group instructions by their extension and create ExtensionInfo objects
    for (const inst of instructions) {
        const name = inst.extension || "unknown";
        const slug = inst.extensionSlug || "unknown";
        if (!byExtension.has(name)) {
            byExtension.set(name, {
                name, slug,
                description: extensionDescriptions[name] || null,
                instructions: [],
            });
        }
        byExtension.get(name)!.instructions.push(inst);
    }

    // Sort instructions within each extension and count them
    const list = Array.from(byExtension.values());
    for (const entry of list) {
        entry.instructions.sort((a: InstructionInfo, b: InstructionInfo) =>
            a.name.localeCompare(b.name));
        entry.count = entry.instructions.length;
    }

    // Sort extensions alphabetically by name
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
};
