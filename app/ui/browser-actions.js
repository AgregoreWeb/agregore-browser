/* global HTMLElement, customElements */

class BrowserActions extends HTMLElement {
  async connectedCallback () {
  /*
    const remote = require('@electron/remote')
    const Extensions = remote.require('./extensions')

    const actions = await Extensions.listActions()

    for (const { title, icon, onClick } of actions) {
      const button = document.createElement('button')
      button.setAttribute('class', 'browser-actions-button')
      button.setAttribute('title', title)
      button.addEventListener('click', () => {
        onClick(this.tabId)
      })
      button.innerHTML = `
        <img src=${icon} class="browser-actions-icon" />
      `
      this.appendChild(button)
    } */
  }

  get tabId () {
    return this.getAttribute('tab-id')
  }
}

customElements.define('browser-actions', BrowserActions)
