const { app, shell } = require("electron");
const fs = require("fs-extra");
const os = require("os");
const { join } = require("path");

const { accelerators, extensions } = require("./config");

const FOCUS_URL_BAR_SCRIPT = `
document.getElementById('search').focus()
`;

const OPEN_FIND_BAR_SCRIPT = `
document.getElementById('find').show()
`;

const DEFAULT_CONFIG_FILE_NAME = ".agregorerc";

module.exports = { createActions };

function createActions({ createWindow }) {
	return {
		OpenDevTools: {
			label: "Open Dev Tools",
			accelerator: accelerators.OpenDevTools,
			click: onOpenDevTools,
		},
		NewWindow: {
			label: "New Window",
			click: onNewWindow,
			accelerator: accelerators.NewWindow,
		},
		Forward: {
			label: "Forward",
			accelerator: accelerators.Forward,
			click: onGoForward,
		},
		Back: {
			label: "Back",
			accelerator: accelerators.Back,
			click: onGoBack,
		},
		FocusURLBar: {
			label: "Focus URL Bar",
			click: onFocusURLBar,
			accelerator: accelerators.FocusURLBar,
		},
		FindInPage: {
			label: "Find in Page",
			click: onFindInPage,
			accelerator: accelerators.FindInPage,
		},
		Reload: {
			label: "Reload",
			accelerator: accelerators.Reload,
			click: onReload,
		},
		HardReload: {
			label: "Hard Reload",
			accelerator: accelerators.HardReload,
			click: onHardReload,
		},
		LearnMore: {
			label: "Learn More",
			accelerator: accelerators.LearnMore,
			click: onLearnMore,
		},
		SetAsDefault: {
			label: "Set as Default Browser",
			accelerator: accelerators.SetAsDefault,
			click: onSetAsDefault,
		},
		OpenExtensionFolder: {
			label: "Open Extensions Folder",
			accelerator: accelerators.OpenExtensionFolder,
			click: onOpenExtensionFolder,
		},
		EditConfigFile: {
			label: "Edit Configuration File",
			accelerators: accelerators.EditConfigFile,
			click: onEditConfigFile,
		},
	};
	function onSetAsDefault() {
		app.setAsDefaultProtocolClient("http");
		app.setAsDefaultProtocolClient("https");
	}

	function onLearnMore() {
		shell.openExternal("https://github.com/RangerMauve/agregore-browser");
	}

	function onOpenDevTools(event, focusedWindow) {
		const contents = getContents(focusedWindow);
		contents.forEach((webContents) => {
			webContents.openDevTools();
		});
	}

	function onNewWindow() {
		createWindow();
	}

	function onFocusURLBar(event, focusedWindow) {
		focusedWindow.webContents.focus();
		focusedWindow.webContents.executeJavaScript(FOCUS_URL_BAR_SCRIPT, true);
	}

	function onFindInPage(event, focusedWindow) {
		focusedWindow.webContents.focus();
		focusedWindow.webContents.executeJavaScript(OPEN_FIND_BAR_SCRIPT, true);
	}

	function onReload(event, focusedWindow) {
		// Reload
		getContents(focusedWindow).forEach((webContents) => {
			webContents.reload();
		});
	}

	function onHardReload(event, focusedWindow) {
		// Hard reload
		getContents(focusedWindow).forEach((webContents) => {
			webContents.reloadIgnoringCache();
		});
	}

	function onGoForward(event, focusedWindow) {
		getContents(focusedWindow).forEach((webContents) => {
			webContents.goForward();
		});
	}

	function onGoBack(event, focusedWindow) {
		getContents(focusedWindow).forEach((webContents) => {
			webContents.goBack();
		});
	}

	function getContents(focusedWindow) {
		const views = focusedWindow.getBrowserViews();
		if (!views.length) return [focusedWindow.webContents];
		return views.map(({ webContents }) => webContents);
	}

	async function onOpenExtensionFolder() {
		const { dir } = extensions;
		await fs.ensureDir(dir);

		await shell.openPath(dir);
	}

	async function onEditConfigFile() {
		const file = join(os.homedir(), DEFAULT_CONFIG_FILE_NAME);

		const exists = await fs.pathExists(file);

		if (!exists) await fs.writeJson(file, {});

		await shell.openPath(file);
	}
}
