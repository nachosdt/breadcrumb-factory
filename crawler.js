const axios = require("axios");
const fs = require("fs");

const root = new URL("https://www.promofarma.com/");

// Get HTML code from URL,
// extract all <a></a> tags with its textContent and href attributes
// and return an array of objects
const crawlUrl = async (url) => {
    let anchors = [];
    let err = false;
    let status;
    try {
        const response = await axios.get(url);
        status = response.status;
        let html = response.data;
        const links = html.match(/<a\s.*?>.*?<\/a>/gs);
        links.forEach((link) => {
            let text = link
                .match(/<a.*?>(.*?)<\/a>/s)[1]
                .replace(/\n/g, "")
                .trim();
            // Delete all HTML tags from text
            text = text.replace(/<\/?[^>]+(>|$)/g, "");
            let href = link.match(/href="(.*?)"/)[1];
            let realUrl = new URL(href, url);
            realUrl.hostname === root.hostname &&
                anchors.push({
                    parents: [url],
                    url: realUrl.href,
                    text: [text],
                });
        });
    } catch (err) {
        error = true;
        status = error.status;
    }

    return { error: err, status: status, links: anchors };
};

// check if 2 arrays are equal
const isEqual = (arr1, arr2) => {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
};

// Return first element of arr1 missing in arr2
const getFirst100MissingElements = (arr1, arr2) => {
    let firstMissing = [];
    for (let i = 0; i < arr1.length; i++) {
        if (!arr2.includes(arr1[i])) {
            firstMissing.push(arr1[i]);
            if (firstMissing.length === 100) {
                return firstMissing;
            }
        }
    }
    return firstMissing;
};

async function getAllLinks() {
    let startTime = Date.now();
    while (!isEqual(uniqeUrls, crawledUrls)) {
        let firstMissing = getFirst100MissingElements(uniqeUrls, crawledUrls);
        let urlsToCrawl = firstMissing.filter(
            (url) => !crawledUrls.includes(url)
        );
        crawledUrls = [...crawledUrls, ...urlsToCrawl];
        let promises = urlsToCrawl.map((url) => crawlUrl(url));
        let results = await Promise.all(promises);
        let allLinks = [];
        results.forEach((result) => {
            allLinks = allLinks.concat(result.links);
        });
        allLinks.forEach((link) => {
            if (!uniqeUrls.includes(link.url)) {
                uniqeUrls.push(link.url);
                data.push(link);
            } else {
                let included = data.find((element) => element.url === link.url);
                if (!included.text.includes(link.text[0])) {
                    included.text.push(link.text[0]);
                }
                if (!included.parents.includes(link.parents[0])) {
                    included.parents.push(link.parents[0]);
                }
            }
        });
        if (crawledUrls.length !== 1) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine();
        }
        process.stdout.write(crawledUrls.length + " urls crawled...\n");
        process.stdout.write(uniqeUrls.length + " unique urls found...");
    }
    fs.writeFileSync(`${root.hostname}.json`, JSON.stringify(data, null, 4));
    let endTime = Date.now();
    console.log("\nTotal time: " + (endTime - startTime) / 60000 + " minutes");
}

let uniqeUrls = [root.href];
let crawledUrls = [];
let data = [{ parents: [], url: root.href, text: [] }];
getAllLinks();
