import Asciidoctor from "asciidoctor";


const asciidoctor = Asciidoctor();


// Strips Ruby ERB template tags from the input text, but retains the content within. 
function stripErb(text) {
    return text
        .replace(/<%=(.*?)%>/gs, "$1")  // strip <%= %> delimiters, keep expression text
        .replace(/<%(.*?)%>/gs, "");  // strip <% %> delimiters, keep content text
}


// Convert AsciiDoc-formatted instruction descriptions to HTML using asciidoctor.js.
function descriptionToHtml(text) {
    if (!text) return "";
    return asciidoctor.convert(stripErb(text), { safe: "safe", standalone: false });
}


export default function (eleventyConfig) {
    // Ignore .gitignore and use .eleventyignore instead
    eleventyConfig.setUseGitIgnore(false);
    eleventyConfig.addFilter("descriptionHtml", descriptionToHtml);

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
