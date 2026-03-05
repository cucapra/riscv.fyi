export default function (eleventyConfig) {
    // Ignore .gitignore and use .eleventyignore instead
    eleventyConfig.setUseGitIgnore(false);

    // Copy over static resources.
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/scripts/**/*.js");

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
