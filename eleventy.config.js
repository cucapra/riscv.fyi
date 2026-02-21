import * as esbuild from "esbuild";

export default function (eleventyConfig) {
    // Ignore .gitignore and use .eleventyignore instead
    eleventyConfig.setUseGitIgnore(false);

    // Copy over static resources.
    eleventyConfig.addPassthroughCopy("src/style.css");

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
