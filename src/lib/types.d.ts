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

interface YamlDoc {
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

interface ExtensionInfo {
    name: string;
    slug: string;
    description: string | null;
    instructions: InstructionInfo[];
    count?: number;
}

declare module "bit-field/lib/render.js" {
    const render: (segments: any[], options?: any) => any;
    export default render;
}

declare module "onml" {
    export function stringify(jsonml: any, options?: any): string;
    export function parse(xml: string): any;
}
