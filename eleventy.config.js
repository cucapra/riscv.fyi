import * as esbuild from "esbuild";

export default function (eleventyConfig) {
    // Static resources.
    eleventyConfig.addPassthroughCopy("src/style.css");

    // This is the incantation recommended to enable TypeScript compilation for
    // frontend scripts.
    eleventyConfig.addTemplateFormats("ts");
    eleventyConfig.addExtension("ts", {
        outputFileExtension: "js",
        compile: async (inputContent, inputPath) => {
            return async (data) => {
                let { code } = await esbuild.transform(inputContent, {
                loader: "ts",
                minify: process.env.NODE_ENV === "production",
                });
                return code;
            };
        },
    });

    // A filter to format bit ranges in a more human-friendly way.
    eleventyConfig.addFilter("bitRange", function (range) {
        if (!range) return "";
        if (typeof range === "string") return range;
        if (Array.isArray(range)) return `${range[0]}-${range[1]}`;
        return String(range);
    });

    // Directory configurations and template engines.
    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            data: "_data",
        },
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk",
    };
}
