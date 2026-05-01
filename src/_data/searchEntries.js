import loadInstructions from "../lib/loadInstructions.js";
import loadPseudoInstructions from "../lib/loadPseudoInstructions.js";

export default () => {
    const real = loadInstructions().map((inst) => ({
        name: inst.name,
        search: (inst.name + " " + inst.longName).toLowerCase(),
        mnemonic: inst.name.toLowerCase(),
        extension: inst.extension,
        extensionSlug: inst.extensionSlug,
        url: `/${inst.extensionSlug}/${inst.name}/`,
        isPseudo: false,
        realInstName: null,
    }));

    const pseudo = loadPseudoInstructions().map((p) => ({
        name: p.mnemonic,
        search: p.mnemonic.toLowerCase(),
        mnemonic: p.mnemonic.toLowerCase(),
        extension: p.extension,
        extensionSlug: p.extensionSlug,
        url: `/${p.extensionSlug}/${p.realInstName}/`,
        isPseudo: true,
        realInstName: p.realInstName,
    }));

    return [...real, ...pseudo].sort((a, b) => a.name.localeCompare(b.name));
};