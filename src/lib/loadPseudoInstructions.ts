import loadInstructions from "./loadInstructions.js";


let cache: PseudoInstructionInfo[] | null = null;


// Returns a flat list of all pseudo-instructions across all extensions.
// Same-mnemonic shortened forms (e.g. "jal imm" from jal) are excluded since
// they aren't independently searchable mnemonics.
export default function loadPseudoInstructions(): PseudoInstructionInfo[] {
    if (cache) return cache;
    const pseudoInstructions: PseudoInstructionInfo[] = loadInstructions()
        .flatMap((inst) =>
            inst.pseudoinstructions
                .filter((p) => p.to.split(" ")[0] !== inst.name)
                .map((p) => ({
                    mnemonic: p.to.split(" ")[0],
                    syntax: p.to,
                    realInstName: inst.name,
                    extension: inst.extension,
                    extensionSlug: inst.extensionSlug,
                }))
        );

    cache = pseudoInstructions;
    return pseudoInstructions;
}
