const { Readable } = require("stream");

module.exports = function fetchToHandler(fetch) {
	return async function protocolHandler(req, sendResponse) {
		const headers = {
			"Access-Control-Allow-Origin": "*",
			"Allow-CSP-From": "*",
			"Cache-Control": "no-cache",
		};

		try {
			const { url, headers: requestHeaders, method, uploadData } = req;

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
				body: data,
				headers: responseHeaders,
			} = response;

			responseHeaders.forEach(([key, value]) => {
				headers[key] = value;
			});

			sendResponse({
				statusCode,
				headers,
				data,
			});
		} catch (e) {
			sendResponse({
				statusCode: 500,
				headers,
				data: intoStream(e.stack),
			});
		}
	};
};

function intoStream(data) {
	return new Readable({
		read() {
			this.push(data);
			this.push(null);
		},
	});
}
