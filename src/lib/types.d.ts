interface Segment {
    from: number;
    to: number;
}


interface Field {
    label: string;
    from: number;
    to: number;
    width: number;
    kind: "var" | "const";
    segments?: Segment[];
}


interface EncodingDoc {
    match?: string;
    variables?: { name: string; location: string | number }[];
    [variant: string]: unknown; // For handling RV32/RV64 variants
}


interface PseudoInstruction {
    when: string;
    to: string;
    resolvedSyntax: string;
}


interface YamlDoc {
    name: string;
    long_name?: string;
    description?: string;
    definedBy?: unknown;
    base?: number;
    assembly?: string | string[];
    encoding?: EncodingDoc;
    pseudoinstructions?: PseudoInstruction[];
}


interface InstructionInfo {
    name: string;
    longName: string;
    description: string;
    definedBy: string;
    definedByRaw: unknown;
    base: number;
    syntax: string;
    encodingType?: string;
    encoding: {
        match: string | null;
        variables: unknown[];
        fields: Field[];
        opcode?: string;
        funct3?: string;
        funct7?: string;
    };
    extension: string;
    extensionSlug: string;
    bitfieldSVG: string;
    pseudoinstructions: PseudoInstruction[];
}


interface PseudoInstructionInfo {
    mnemonic: string;
    syntax: string;
    realInstName: string;
    extension: string;
    extensionSlug: string;
}


interface ExtensionListEntry {
    name: string;
    url: string;
    label: string;
    isPseudo: boolean;
    base: number;
}

interface ExtensionInfo {
    name: string;
    slug: string;
    description: string | null;
    instructions: InstructionInfo[];
    pseudoInstructions: PseudoInstructionInfo[];
    sortedEntries: ExtensionListEntry[];
    count: number;
    pseudoCount: number;
}


declare module "bit-field/lib/render.js" {
    interface BitFieldSegment {
        name: string;
        bits: number;
    }

    interface BitFieldRenderOptions {
        bits?: 16 | 32;
        vflip?: boolean;
        lanes?: number;
        hspace?: number;
    }

    const render: (segments: BitFieldSegment[], options?: BitFieldRenderOptions) => string;
    export default render;
}


declare module "onml" {
    type JsonML = string | [string, { [key: string]: unknown }?, ...JsonML[]];
    export function stringify(jsonml: JsonML): string;
}
