const fs = require('fs');

// https://github.com/Redocly/redocly-cli/issues/1035
// this script can be deleted when this gets fixed

const htmlFilePath = process.argv[2];
const htmlContent = fs.readFileSync(htmlFilePath, { encoding: 'utf8', flag: 'r' });
const scriptStartTagIndex = htmlContent.indexOf("<script src=\"")
if (scriptStartTagIndex === -1) {
    console.log("No script found in the bundle. This script isn't necessary anymore?")
    process.exitCode = 1;
    return;
}

const scriptEndIndex = htmlContent.indexOf("\"></script>", scriptStartTagIndex + 13);
const scriptUrl = htmlContent.substring(scriptStartTagIndex + 13, scriptEndIndex)
console.log("Found URL for the script:", scriptUrl);
// should be something like https://cdn.redoc.ly/redoc/v2.1.3/bundles/redoc.standalone.js
// TODO if this needs to be a long term solution, set up a proxy on nexus and use that.

(async () => {
    const response = await fetch(scriptUrl);
    if (response.status !== 200) {
        console.log("Got wrong status while downloading script:", response.status);
        process.exitCode = 1;
        return;
    }

    const scriptContent = await response.text();
    const filename = scriptUrl.split('/').pop();
    const filePath = htmlFilePath.substring(0, htmlFilePath.lastIndexOf("/") + 1) + filename;
    fs.writeFileSync(filePath, scriptContent, { encoding: "utf8" })
    console.log("Saved external script to ", filePath)

    const newHtmlContent = htmlContent.replace(scriptUrl, filename)
    fs.writeFileSync(htmlFilePath, newHtmlContent, { encoding: "utf8" })
    console.log("Replaced the external script reference with local.")

    if (newHtmlContent.includes("src=\"http")) {
        // We could do the whole thing in a loop but for now let's be aware.
        console.log("Found one more external source. Failing the build to investigate.");
        process.exitCode = 1;
    }
})();
