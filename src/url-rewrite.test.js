import test from 'node:test'
import assert from 'node:assert/strict'
import { rewritePeerWebURL } from './url-rewrite.js'

const HASH = '90c020bd252639622a14895a0fad713b91e0130c'

test('rewrites peerweb root ORC URL to bittorrent index path', () => {
  const input = `https://peerweb.lol/?orc=${HASH}`
  const output = rewritePeerWebURL(input)

  assert.equal(output, `bittorrent://${HASH}/index.html`)
})

test('preserves path when present', () => {
  const input = `https://peerweb.lol/demo/path/?orc=${HASH}`
  const output = rewritePeerWebURL(input)

  assert.equal(output, `bittorrent://${HASH}/demo/path/`)
})

test('preserves non-orc query params and fragment', () => {
  const input = `https://www.peerweb.lol/?orc=${HASH}&debug=true&x=1#hello`
  const output = rewritePeerWebURL(input)

  assert.equal(output, `bittorrent://${HASH}/index.html?debug=true&x=1#hello`)
})

test('normalizes uppercase hash to lowercase', () => {
  const upper = HASH.toUpperCase()
  const input = `https://peerweb.lol/?orc=${upper}`
  const output = rewritePeerWebURL(input)

  assert.equal(output, `bittorrent://${HASH}/index.html`)
})

test('does not rewrite when missing ORC hash', () => {
  const input = 'https://peerweb.lol/?debug=true'
  const output = rewritePeerWebURL(input)

  assert.equal(output, input)
})

test('does not rewrite invalid ORC hash', () => {
  const input = 'https://peerweb.lol/?orc=notahash'
  const output = rewritePeerWebURL(input)

  assert.equal(output, input)
})

test('does not rewrite non-peerweb domains', () => {
  const input = `https://example.com/?orc=${HASH}`
  const output = rewritePeerWebURL(input)

  assert.equal(output, input)
})

test('does not rewrite non-http schemes', () => {
  const input = `bittorrent://${HASH}/`
  const output = rewritePeerWebURL(input)

  assert.equal(output, input)
})
