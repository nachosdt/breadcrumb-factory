const axios = require("axios");
const fs = require("fs");

const root = "https://books.toscrape.com";

// Get HTML code from URL,
// extract all <a></a> tags with its textContent and href attributes
// and return an array of objects
const getLinksFromUrl = async (url) => {
	let anchors = [];
	let error = false;
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
			let href = link.match(/href="(.*?)"/)[1];
			let realUrl = new URL(href, url);
			anchors.push({
				parents: [url],
				url: realUrl.href,
				text: [text],
			});
		});
	} catch (error) {
		error = true;
		status = error.status;
	}

	return { error: error, status: status, links: anchors };
};

async function crawlUrl(url) {
	if (!crawledUrls.includes(url)) {
		crawledUrls.push(url);
		let response = await getLinksFromUrl(url);
		if (response.error) {
		} else {
			response.links.forEach((link) => {
				if (!uniqeUrls.includes(link.url)) {
					uniqeUrls.push(link.url);
					data.push(link);
				} else {
					let included = data.find(
						(element) => element.url === link.url
					);
					if (!included.text.includes(link.text[0])) {
						included.text.push(link.text[0]);
					}
					if (!included.parents.includes(link.parents[0])) {
						included.parents.push(link.parents[0]);
					}
				}
			});
		}
		if (crawledUrls.length !== 1) {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.moveCursor(0, -1);
			process.stdout.clearLine();
		}
		process.stdout.write(crawledUrls.length + " urls crawled...\n");
		process.stdout.write(uniqeUrls.length + " unique urls found...");
		return true;
	}
	return false;
}

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
const getMissingElement = (arr1, arr2) => {
	for (let i = 0; i < arr1.length; i++) {
		if (!arr2.includes(arr1[i])) {
			return arr1[i];
		}
	}
	return null;
};

async function getAllLinks() {
	let startTime = Date.now();
	while (!isEqual(uniqeUrls, crawledUrls)) {
		let firstMissing = getMissingElement(uniqeUrls, crawledUrls);
		let result = await crawlUrl(firstMissing);
	}
	fs.writeFileSync("data.json", JSON.stringify(data, null, 4));
	let endTime = Date.now();
	console.log("\nTotal time: " + (endTime - startTime) / 60000 + " minutes");
}

function updateUniqueUrlsFile() {
	fs.writeFileSync("uniqueUrls.json", JSON.stringify(uniqeUrls, null, 4));
}

function updateCrawledUrlsFile() {
	fs.writeFileSync("crawledUrls.json", JSON.stringify(crawledUrls, null, 4));
}

let uniqeUrls = [root];
let crawledUrls = [];
let data = [];
getAllLinks();
