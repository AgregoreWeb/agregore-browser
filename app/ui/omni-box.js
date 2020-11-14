/* global HTMLElement, CustomEvent, customElements */

class OmniBox extends HTMLElement {
	constructor() {
		super();
		this.firstLoad = true;
		this.lastSearch = 0;
	}

	get options() {
		return document.querySelector("#" + this.getAttribute("nav-options-id"));
	}

	connectedCallback() {
		this.innerHTML = `
      <section class="omni-box-header">
        <button class="hidden omni-box-button omni-box-back" title="Go back in history">⬅</button>
        <button class="hidden omni-box-button omni-box-forward" title="Go forward in history">➡</button>
        <form class="omni-box-form">
          <input class="omni-box-input" title="Enter search params">
          <button class="omni-box-button" type="submit" title="Load page or Reload">⊚</button>
        </form>
      </section>
    `;
		this.backButton = this.$(".omni-box-back");
		this.forwardButton = this.$(".omni-box-forward");
		this.form = this.$(".omni-box-form");
		this.input = this.$(".omni-box-input");

		this.input.addEventListener("focus", () => {
			this.input.select();
		});

		this.form.addEventListener("submit", (e) => {
			e.preventDefault(true);

			const rawURL = this.getURL();

			const url = isURL(rawURL)
				? rawURL
				: looksLikeDomain(rawURL)
				? makeHttps(rawURL)
				: makeDuckDuckGo(rawURL);

			this.clearOptions();

			const searchID = Date.now();
			this.lastSearch = searchID;

			this.dispatchEvent(
				new CustomEvent("navigate", {
					detail: {
						url,
					},
				})
			);
		});
		this.input.addEventListener("input", () => {
			this.updateOptions();
		});
		this.input.addEventListener("keydown", ({ keyCode, key }) => {
			// Pressed down arrow
			if (keyCode === 40) this.selectNext();

			// Pressed up arrow
			if (keyCode === 38) this.selectPrevious();

			if (keyCode === 39) {
				const { selectionStart, selectionEnd, value } = this.input;
				const isAtEnd =
					selectionStart === value.length && selectionEnd === value.length;
				if (isAtEnd) this.fillWithSelected();
			}

			if (key === "Escape") {
				this.clearOptions();
				this.dispatchEvent(new CustomEvent("unfocus"));
			}
		});

		this.backButton.addEventListener("click", () => {
			this.dispatchEvent(new CustomEvent("back"));
		});
		this.forwardButton.addEventListener("click", () => {
			this.dispatchEvent(new CustomEvent("forward"));
		});
	}

	clearOptions() {
		this.options.innerHTML = "";
	}

	getURL() {
		const item = this.getSelected();

		return item ? item.dataset.url : this.input.value;
	}

	getSelected() {
		return (
			this.options.querySelector("[data-selected]") ||
			this.options.firstElementChild
		);
	}

	selectNext() {
		const item = this.getSelected();

		if (!item) return;

		const sibling = item.nextElementSibling;

		if (!sibling) return;

		item.removeAttribute("data-selected");
		sibling.setAttribute("data-selected", "selected");
	}

	selectPrevious() {
		const item = this.getSelected();

		if (!item) return;

		const sibling = item.previousElementSibling;

		if (!sibling) return;

		item.removeAttribute("data-selected");
		sibling.setAttribute("data-selected", "selected");
	}

	fillWithSelected() {
		const item = this.getSelected();

		if (!item) return;

		const { url } = item.dataset;

		this.input.value = url;
	}

	async updateOptions() {
		const query = this.input.value;

		const searchID = Date.now();
		this.lastSearch = searchID;

		this.clearOptions();

		if (!query) {
			return;
		}

		this.dispatchEvent(
			new CustomEvent("search", {
				detail: {
					query,
					searchID,
				},
			})
		);
	}

	async setSearchResults(results, query, searchID) {
		if (this.lastSearch !== searchID) {
			return console.debug(
				"Urlbar changed since query finished",
				this.lastSearch,
				searchID,
				query
			);
		}

		const finalItems = [];

		if (isURL(query)) {
			finalItems.push(this.makeNavItem(query, `Go to ${query}`));
		} else if (looksLikeDomain(query)) {
			finalItems.push(
				this.makeNavItem(makeHttps(query), `Go to https://${query}`)
			);
		} else {
			finalItems.push(
				this.makeNavItem(
					makeDuckDuckGo(query),
					`Search for "${query}" on DuckDuckGo`
				)
			);
		}

		finalItems.push(
			...results.map(({ title, url }) =>
				this.makeNavItem(url, `${title} - ${url}`)
			)
		);

		for (const item of finalItems) {
			this.options.appendChild(item);
		}

		this.getSelected().setAttribute("data-selected", "selected");
	}

	makeNavItem(url, text) {
		const element = document.createElement("button");
		element.classList.add("omni-box-nav-item");
		element.classList.add("omni-box-button");
		element.dataset.url = url;
		element.innerText = text;
		element.onclick = () => {
			this.clearOptions();

			this.dispatchEvent(
				new CustomEvent("navigate", {
					detail: {
						url,
					},
				})
			);
		};
		return element;
	}

	static get observedAttributes() {
		return ["src", "back", "forward"];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === "src") {
			this.input.value = newValue;
			if (this.firstLoad && newValue === window.DEFAULT_PAGE) {
				this.firstLoad = false;
				this.focus();
			}
		}
		if (name === "back") {
			this.backButton.classList.toggle("hidden", newValue === "hidden");
		} else if (name === "forward") {
			this.forwardButton.classList.toggle("hidden", newValue === "hidden");
		}
	}

	get src() {
		return this.input.value;
	}

	set src(value) {
		this.setAttribute("src", value);
	}

	focus() {
		this.input.focus();
		this.input.select();
	}

	$(query) {
		return this.querySelector(query);
	}
}

function makeHttps(query) {
	return `https://${query}`;
}

function makeDuckDuckGo(query) {
	return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
}

function isURL(string) {
	try {
		return !!new URL(string);
	} catch {
		return false;
	}
}

function looksLikeDomain(string) {
	return !string.match(/\s/) && string.includes(".");
}

customElements.define("omni-box", OmniBox);
