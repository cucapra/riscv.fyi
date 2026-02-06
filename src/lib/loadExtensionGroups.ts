import baseExtensionData from "./baseExtensionData.json" with { type: "json" };

type ExtensionGroupInfoDict = Record<string, ExtensionGroupInfo>; // Map from group name to group info

type ExtensionGroupInfo = {
    name: string;
    description: string;
    extensions: Record<string, string>; // Map from extension code to extension description
    count: number;
};

export default () => {
    const extensionGroups: ExtensionGroupInfoDict = {};

    for (const [groupName, groupData] of Object.entries(baseExtensionData)) {
        extensionGroups[groupName] = {
            name: groupName,
            description: groupData.description,
            extensions: groupData.extensions,
            count: Object.keys(groupData.extensions).length,
        };
    }

    return extensionGroups;
};
