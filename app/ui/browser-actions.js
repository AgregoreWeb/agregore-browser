/* global HTMLElement, customElements */

class BrowserActions extends HTMLElement {
	async connectedCallback() {
		const current = window.getCurrentWindow();

		const actions = await current.listExtensionActions();

		for (const { title, icon, id } of actions) {
			const button = document.createElement("button");
			button.setAttribute("class", "browser-actions-button");
			button.setAttribute("title", title);
			button.addEventListener("click", () => {
				current.clickExtensionAction(id);
			});
			button.innerHTML = `
        <img src=${icon} class="browser-actions-icon" />
      `;
			this.appendChild(button);
		}
	}

	get tabId() {
		return this.getAttribute("tab-id");
	}
}

customElements.define("browser-actions", BrowserActions);
