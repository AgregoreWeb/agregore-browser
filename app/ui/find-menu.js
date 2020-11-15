/* global CustomEvent, customElements, HTMLElement */

class FindMenu extends HTMLElement {
  constructor () {
    super()

    this.addEventListener('keydown', ({ key }) => {
      if (key === 'Escape') this.hide()
    })
  }

  connectedCallback () {
    this.innerHTML = `
      <input class="find-menu-input" title="Enter text to find in page" />
      <button class="find-menu-button find-menu-previous" title="Find previous item">▲</button>
      <button class="find-menu-button find-menu-next" title="Find next item">▼</button>
      <button class="find-menu-button find-menu-hide" title="Hide find menu">✖</button>
    `

    this.input = this.$('.find-menu-input')
    this.previousButton = this.$('.find-menu-previous')
    this.nextButton = this.$('.find-menu-next')
    this.hideButton = this.$('.find-menu-hide')

    this.input.addEventListener('input', (e) => {
      const { value } = this

      if (!value) return

      this.dispatchEvent(new CustomEvent('next', { detail: { value } }))
    })

    this.input.addEventListener('keydown', ({ keyCode, shiftKey }) => {
      if (keyCode === 13) {
        const { value } = this

        if (!value) return this.hide()

        const direction = shiftKey ? 'previous' : 'next'
        this.dispatchEvent(new CustomEvent(direction, { detail: { value, findNext: true } }))
      }
    })

    this.previousButton.addEventListener('click', () => {
      const { value } = this

      if (!value) return

      this.dispatchEvent(new CustomEvent('previous', { detail: { value, findNext: false } }))
    })
    this.nextButton.addEventListener('click', () => {
      const { value } = this

      if (!value) return

      this.dispatchEvent(new CustomEvent('next', { detail: { value, findNext: true } }))
    })
    this.hideButton.addEventListener('click', () => this.hide())
  }

  get value () {
    return this.input.value
  }

  show () {
    this.classList.toggle('hidden', false)
    setTimeout(() => {
      this.focus()
    }, 10)
  }

  hide () {
    this.classList.toggle('hidden', true)
    this.dispatchEvent(new CustomEvent('hide'))
  }

  toggle () {
    const isActive = this.classList.toggle('hidden')
    if (isActive) this.focus()
    else this.dispatchEvent(new CustomEvent('hide'))
  }

  focus () {
    this.input.focus()
    this.input.select()
  }

  $ (query) {
    return this.querySelector(query)
  }
}

customElements.define('find-menu', FindMenu)
