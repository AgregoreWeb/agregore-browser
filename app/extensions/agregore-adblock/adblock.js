(window.browser || window.chrome).webRequest.onBeforeRequest.addListener(
	() => ({ cancel: true }),
	{
		urls: window.BLOCK_URLS,
	},
	["blocking"]
);
