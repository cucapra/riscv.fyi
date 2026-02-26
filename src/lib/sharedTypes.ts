export interface Field {
    label: string;
    from: number;
    to: number;
    width: number;
    kind: "var" | "const";
    segments?: { from: number; to: number }[];
}


export interface InstructionInfo {
    name: string;
    longName: string;
    description: string;
    definedBy: string;
    definedByRaw: any;
    base: number;
    syntax: string;
    encodingType?: string;
    encoding: {
        match: string | null;
        variables: any[];
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
