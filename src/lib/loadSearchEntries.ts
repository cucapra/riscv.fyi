import loadInstructions from "./loadInstructions.js";
import loadPseudoInstructions from "./loadPseudoInstructions.js";


export default function loadSearchEntries(): SearchEntry[] {
    const real: SearchEntry[] = loadInstructions().map((inst) => ({
        name: inst.name,
        search: (inst.name + " " + inst.longName).toLowerCase(),
        mnemonic: inst.name.toLowerCase(),
        extension: inst.extension,
        extensionSlug: inst.extensionSlug,
        url: `/${inst.extensionSlug}/${inst.name}/`,
        isPseudo: false,
        realInstName: null,
    }));

    const pseudo: SearchEntry[] = loadPseudoInstructions().map((p) => ({
        name: p.mnemonic,
        search: p.mnemonic.toLowerCase(),
        mnemonic: p.mnemonic.toLowerCase(),
        extension: p.extension,
        extensionSlug: p.extensionSlug,
        url: `/${p.extensionSlug}/${p.realInstName}/`,
        isPseudo: true,
        realInstName: p.realInstName,
    }));

    return [...real, ...pseudo].sort((a, b) => a.extension.localeCompare(b.extension) || a.name.localeCompare(b.name));
}
