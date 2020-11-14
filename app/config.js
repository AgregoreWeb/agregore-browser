const { app } = require("electron");
const path = require("path");

const DEFAULT_EXTENSIONS_DIR = path.join(app.getPath("userData"), "extensions");
const DEFAULT_IPFS_DIR = path.join(app.getPath("userData"), "ipfs");

module.exports = require("rc")("agregore", {
	accelerators: {
		OpenDevTools: "CommandOrControl+Shift+I",
		NewWindow: "CommandOrControl+N",
		Forward: "CommandOrControl+]",
		Back: "CommandOrControl+[",
		FocusURLBar: "CommandOrControl+L",
		FindInPage: "CommandOrControl+F",
		Reload: "CommandOrControl+R",
		HardReload: "CommandOrControl+Shift+R",
		LearnMore: null,
		OpenExtensionsFolder: null,
		EditConfigFile: "CommandOrControl+.",
	},
	extensions: {
		dir: DEFAULT_EXTENSIONS_DIR,
		// TODO: This will be for loading extensions from remote URLs
		remote: [],
	},
	theme: {
		"font-family": "system-ui",
		background: "var(--ag-color-black)",
		text: "var(--ag-color-white)",
		primary: "var(--ag-color-purple)",
		secondary: "var(--ag-color-green)",
		indent: "16px",
		"max-width": "666px",
	},
	ipfsOptions: {
		repo: DEFAULT_IPFS_DIR,
		silent: true,
	},
});
