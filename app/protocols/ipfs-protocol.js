const { Readable } = require("stream");

const IPFS = require("ipfs");
const makeFetch = require("js-ipfs-fetch");

module.exports = async function createHandler(options) {
	const ipfs = await IPFS.create(options);
	const fetch = makeFetch({ ipfs });

	return async function protocolHandler(req, sendResponse) {
		const { url, headers: requestHeaders, method, uploadData } = req;

		console.log(req);

		const body = uploadData
			? uploadData.length > 1
				? uploadData
				: uploadData[0]
			: null;

		const response = await fetch(url, {
			headers: requestHeaders,
			method,
			body,
		});

		const {
			status: statusCode,
			body: resBody,
			headers: responseHeaders,
		} = response;

		const headers = {
			"Access-Control-Allow-Origin": "*",
			"Allow-CSP-From": "*",
			"Cache-Control": "no-cache",
		};

		responseHeaders.forEach(([key, value]) => {
			headers[key] = value;
		});

		sendResponse({
			statusCode,
			headers,
			data: Readable.from(resBody),
		});
	};
};
