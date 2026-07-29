import elf from 'agregore://elves/elf.js'
import QrCreator from 'agregore://vendor/qr-creator/qr-creator.js'

// utilize this to hop off the bifrost
function sleep(D) { return new Promise(x => setTimeout(x,D))}

const $ = elf('qr-code')

$.draw(target => {
  const codes = $.learn()
  const code = target.getAttribute('src')
  const image = codes[code]
  const { fg='saddlebrown', bg='lemonchiffon' } = target.dataset
  generate(target, code, {fg, bg})
  return image ? `
    <button class="portal" style="--fg: ${fg}; --bg: ${bg}">
      ${image}
    </button>
  ` : 'loading...'
})

async function generate(target, code, {fg, bg}) {
  if(target.code === code) return
  target.code = code
  await sleep(1) // get this off the bifrost
  const node = document.createElement('div')

  QrCreator.render({
    text: code,
    radius: 0.5, // 0.0 to 0.5
    ecLevel: 'L', // L, M, Q, H
    fill: fg, // foreground color
    background: bg, // color or null for transparent
    size: 1080 // in pixels
  }, node);

  const dataURL = node.querySelector('canvas').toDataURL()

  $.teach({ [code]: `<img src="${dataURL}" alt="code" />`})
}

$.when('click', '.portal', (event) => {
  const link = event.target.closest($.link)
  const code = link.getAttribute('src') || link.getAttribute('text')
  window.location.href = code
})

$.style(`
  & {
    display: block;
    max-height: 100%;
    max-width: 100%;
    min-width: 120px;
    aspect-ratio: 1;
    position: relative;
    margin: auto;
  }
  & .portal {
    display: grid;
    height: 100%;
    width: 100%;
    place-content: center;
    border: 0;
    background: transparent;
    border-radius: 0;
  }
  & img {
    position: absolute;
    inset: 0;
    max-height: 100%;
    margin: auto;
  }
`)

