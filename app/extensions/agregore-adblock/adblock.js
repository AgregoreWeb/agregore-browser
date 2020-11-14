(window.browser || window.chrome).webRequest.onBeforeRequest.addListener(
	() => {
		return {
			cancel: true,
		};
	},
	{
		urls: window.BLOCK_URLS,
	},
	["blocking"]
);
