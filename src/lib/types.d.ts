export interface YamlDoc {
    name: string;
    long_name?: string;
    description?: string;
    definedBy?: unknown;
    base?: number;
    assembly?: string | string[];
    encoding?: {
        match?: string;
        variables?: { name: string; location: string | number }[];
        [key: string]: any;
    };
}


export interface Segment {
    from: number;
    to: number;
    width?: number;
}


export interface Field {
    label: string;
    from: number;
    to: number;
    width: number;
    kind: "var" | "const";
    segments?: Segment[];
}


export interface InstructionInfo {
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
}


export interface ExtensionInfo {
    name: string;
    slug: string;
    description: string | null;
    instructions: InstructionInfo[];
    count?: number;
}
