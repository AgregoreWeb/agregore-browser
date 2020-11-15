const { BrowserWindow, BrowserView, ipcMain, app } = require("electron");
const path = require("path");
const EventEmitter = require("events");
const fs = require("fs-extra");

const MAIN_PAGE = path.resolve(__dirname, "../ui/index.html");
const LOGO_FILE = path.join(__dirname, "../../build/icon.png");
const PERSIST_FILE = path.join(app.getPath("userData"), "lastOpened.json");

const DEFAULT_PAGE = "agregore://welcome";

const IS_DEBUG = process.env.NODE_ENV === "debug";

const WINDOW_METHODS = [
	"goBack",
	"goForward",
	"reload",
	"focus",
	"loadURL",
	"getURL",
	"findInPage",
	"stopFindInPage",
	"setBounds",
	"searchHistory",
	"listExtensionActions",
	"clickExtensionAction",
];

async function DEFAULT_SEARCH() {
	return [];
}

async function DEFAULT_LIST_ACTIONS() {
	return [];
}

class WindowManager extends EventEmitter {
	constructor({
		onSearch = DEFAULT_SEARCH,
		listActions = DEFAULT_LIST_ACTIONS,
		persistTo = PERSIST_FILE,
	} = {}) {
		super();
		this.windows = new Set();
		this.onSearch = onSearch;
		this.listActions = listActions;
		this.persistTo = persistTo;

		WINDOW_METHODS.forEach((method) => {
			this.relayMethod(method);
		});
	}

	open(opts = {}) {
		const { onSearch, listActions } = this;
		const window = new Window({ ...opts, onSearch, listActions });

		console.log("created window", window.id);
		this.windows.add(window);
		window.once("close", () => {
			this.windows.delete(window);
			this.emit("close", window);
		});
		this.emit("open", window);

		window.load();

		return window;
	}

	relayMethod(name) {
		ipcMain.handle(`agregore-window-${name}`, ({ sender }, ...args) => {
			const { id } = sender;
			console.log("<-", id, name, "(", args, ")");
			const window = this.get(id);
			if (!window)
				return console.warn(`Got method ${name} from invalid frame ${id}`);

			return window[name](...args);
		});
	}

	get(id) {
		this.windows.forEach((window) => {
			if (window.id === id) return window;
		});
		return null;
	}

	get all() {
		return [...this.windows.values()];
	}

	async saveOpened() {
		let urls = await Promise.all(
			this.all.map(async (window) => {
				const url = window.web.getURL();
				const position = window.window.getPosition();
				const size = window.window.getSize();

				return { url, position, size };
			})
		);

		if (urls.length === 1) urls = [];

		fs.outputJsonSync(this.persistTo, urls);
	}

	async openSaved() {
		const saved = await this.loadSaved();

		return Promise.all(
			saved.map((info) => {
				console.log("About to open", info);
				const options = {};

				if (typeof info === "string") {
					options.url = info;
				} else {
					const { url, position, size } = info;

					options.url = url;

					if (position) {
						const [x, y] = position;
						options.x = x;
						options.y = y;
					}

					if (size) {
						const [width, height] = size;
						options.width = width;
						options.height = height;
					}
				}

				return this.open(options);
			})
		);
	}

	async loadSaved() {
		try {
			const infos = await fs.readJson(this.persistTo);
			return infos;
		} catch (e) {
			console.error("Error loading saved windows", e.stack);
			return [];
		}
	}
}

class Window extends EventEmitter {
	constructor({
		url = DEFAULT_PAGE,
		rawFrame = false,
		noNav = false,
		// noAutoFocus = false, UNUSED
		onSearch,
		listActions,
		view,
		...opts
	} = {}) {
		super();

		this.onSearch = onSearch;
		this.listActions = listActions;
		this.rawFrame = rawFrame;

		this.window = new BrowserWindow({
			autoHideMenuBar: true,
			webPreferences: {
				// partition: 'persist:web-content',
				nodeIntegration: true,
				webviewTag: false,
				contextIsolation: false,
			},
			show: false,
			icon: LOGO_FILE,
			...opts,
		});
		this.view =
			view ||
			new BrowserView({
				webPreferences: {
					partition: "persist:web-content",
					nodeIntegration: false,
					sandbox: true,
					webviewTag: false,
					contextIsolation: true,
				},
			});
		this.window.setBrowserView(this.view);

		this.web.on(
			"did-start-navigation",
			// TODO: Remove shadow
			// eslint-disable-next-line no-shadow
			(event, url, isInPlace, isMainFrame) => {
				this.emitNavigate(url, isMainFrame);
			}
		);
		// TODO: Remove shadow
		// eslint-disable-next-line no-shadow
		this.web.on("did-navigate", (event, url) => {
			this.emitNavigate(url, true);
		});
		// TODO: Remove shadow
		// eslint-disable-next-line no-shadow
		this.web.on("did-navigate-in-page", (event, url, isMainFrame) => {
			this.emitNavigate(url, isMainFrame);
		});
		this.web.on("new-window", (...args) => {
			this.emit("new-window", ...args);
		});

		// Send to UI
		this.web.on("page-title-updated", (event, title) => {
			this.send("page-title-updated", title);
		});
		this.window.on("enter-html-full-screen", () => {
			this.send("enter-html-full-screen");
		});
		this.window.on("leave-html-full-screen", () => {
			this.send("leave-html-full-screen");
		});

		this.window.once("ready-to-show", () => this.window.show());
		this.window.on("close", () => {
			this.web.destroy();
			this.emit("close");
		});

		const toLoad = new URL(MAIN_PAGE, "file:");

		if (url) toLoad.searchParams.set("url", url);
		if (rawFrame) toLoad.searchParams.set("rawFrame", "true");
		if (noNav) toLoad.searchParams.set("noNav", "true");

		this.toLoad = toLoad.href;

		if (IS_DEBUG) {
			// this.web.openDevTools()
			this.window.webContents.openDevTools();
		}
	}

	load() {
		return this.window.loadURL(this.toLoad);
	}

	emitNavigate(url, isMainFrame) {
		if (!isMainFrame) return;
		console.log("Navigating", url);
		const canGoBack = this.web.canGoBack();
		const canGoForward = this.web.canGoForward();

		this.send("navigating", url);
		this.send("history-buttons-change", { canGoBack, canGoForward });
	}

	async goBack() {
		return this.web.goBack();
	}

	async goForward() {
		return this.web.goForward();
	}

	async reload() {
		return this.web.reload();
	}

	async focus() {
		return this.web.focus();
	}

	async loadURL(url) {
		return this.web.loadURL(url);
	}

	async getURL() {
		return this.web.getURL();
	}

	async findInPage(value, opts) {
		return this.web.findInPage(value, opts);
	}

	async stopFindInPage() {
		return this.web.stopFindInPage("clearSelection");
	}

	async searchHistory(...args) {
		return this.onSearch(...args);
	}

	async setBounds(rect) {
		const newRect = {};
		Object.keys(rect).forEach((key) => {
			newRect[key] = Math.floor(rect[key]);
		});
		// Fix non-integer heights causing draw break.
		// TODO: This should be fixed wherever rect is sent from, not sure where that is.

		return this.view.setBounds(newRect);
	}

	async listExtensionActions() {
		const actions = await this.listActions();
		return actions.map(({ title, id, icon }) => ({ title, id, icon }));
	}

	async clickExtensionAction(actionId) {
		await this.focus();
		(await this.listActions()).forEach(async ({ id, onClick }) => {
			if (actionId !== id) return;
			await onClick(this.id);
		});
	}

	send(name, ...args) {
		this.emit(name, ...args);
		console.log("->", this.id, name, "(", args, ")");
		this.window.webContents.send(`agregore-window-${name}`, ...args);
	}

	get web() {
		return this.view.webContents;
	}

	get webContents() {
		return this.window.webContents;
	}

	get id() {
		return this.window.webContents.id;
	}
}

module.exports = { WindowManager, Window };
