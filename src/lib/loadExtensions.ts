import loadInstructions from "./loadInstructions.ts";
import loadExtensionGroups from "./loadExtensionGroups.ts";

export default () => {
    const instructions = loadInstructions();
    const extensionGroups = loadExtensionGroups();

    const extensionsToGroup = {}, extensionToDescription = {};
    for (const [groupName, groupData] of Object.entries(extensionGroups)) {
        for (const ext of Object.keys(groupData.extensions)) {
            extensionsToGroup[ext] = groupName;
            extensionToDescription[ext] = groupData.extensions[ext];
        }
    }

    const extensions = {}
    for (const inst of instructions) {
        const name = inst.extension || "unknown";
        const slug = inst.extensionSlug || "unknown";
        if (!extensions[name]) {
            extensions[name] = {
                name,
                slug,
                description: extensionToDescription[name] || null,
                group: extensionsToGroup[name] || null,
                instructions: [],
            };
        }
        extensions[name].instructions.push(inst);
    }

    const list = Object.values(extensions);
    for (const entry of list) {
        entry.instructions.sort((a, b) => a.name.localeCompare(b.name));
        entry.count = entry.instructions.length;
    }

    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
};
