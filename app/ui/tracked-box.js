/* global HTMLElement, ResizeObserver, CustomEvent, customElements */

class TrackedBox extends HTMLElement {
  constructor () {
    super()

    this.observer = new ResizeObserver(() => this.emitResize())
  }

  connectedCallback () {
    this.observer.observe(this)

    this.emitResize()
  }

  disconnectedCallback () {
    this.observer.unobserve(this)
  }

  emitResize () {
    const { x, y, width, height } = this.getBoundingClientRect()

    this.dispatchEvent(new CustomEvent('resize', { detail: { x, y, width, height } }))
  }
}

customElements.define('tracked-box', TrackedBox)
