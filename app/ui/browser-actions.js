/* global HTMLElement, customElements */

class BrowserActions extends HTMLElement {
  async connectedCallback () {
    this.renderLatest()
  }

  async renderLatest () {
    const current = window.getCurrentWindow()

    const actions = await current.listExtensionActions()
    this.innerHTML = ''

    for (const { title, icon, id, badge } of actions) {
      const button = document.createElement('button')
      button.setAttribute('class', 'browser-actions-button')
      button.setAttribute('title', title)
      button.addEventListener('click', () => {
        current.clickExtensionAction(id)
      })
      const img = document.createElement('img')
      img.setAttribute('class', 'browser-actions-icon')
      img.setAttribute('src', icon)

      button.append(img)

      if (badge && badge.text) {
        const badgeItem = document.createElement('div')

        const badgeColor = badge.color || 'inherit'
        const badgeBackground = badge.background || 'none'
        let badgeStyle = ''
        if (badge.color) badgeStyle += `color: ${badgeColor};`
        if (badge.background) badgeStyle += `background: ${badgeBackground};`

        badgeItem.innerText = badge.text
        badgeItem.setAttribute('class', 'browser-actions-badge')
        badgeItem.setAttribute('style', badgeStyle)
        button.append(badgeItem)
      }

      this.appendChild(button)
    }
  }

  get tabId () {
    return this.getAttribute('tab-id')
  }
}

customElements.define('browser-actions', BrowserActions)
