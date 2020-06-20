#!/usr/bin/env node

const WHITE = '#FCFCFC'
const BLACK = '#111'
const PURPLE = 'rgb(165, 24, 201)'

const GOLD = 1.61803398874989
const DIAMETER = 666
const TRUE_RADIUS = DIAMETER / 2
const RADIUS = DIAMETER / (GOLD * 2.5)
const THICKNESS = DIAMETER / (GOLD * 13)
const INNER = THICKNESS * GOLD
const POINT_WIDTH = 360 / 32

console.log(`
<svg
  version="1.1"
  baseProfile="full"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  viewbox="0 0 666 666"
  width="666"
  height="666"
>
<style>
#outline {
  stroke: ${BLACK};
  stroke-width: ${THICKNESS};
  fill: none;
}
.dot {
  fill: ${BLACK};
}
.point {
  fill: ${BLACK};
}
/*.point:nth-child(odd) {
  fill: ${PURPLE};
}*/
.ray {
  stroke: ${BLACK};
  stroke-width: ${THICKNESS};
}
/*.ray:nth-child(even) {
  stroke: ${PURPLE};
}*/
#background {
  fill: ${WHITE};
  stroke: none;
}
#pupil {
  fill: ${PURPLE};
}
</style>
<g transform="translate(333, 333)">
  <circle id="background" r="${TRUE_RADIUS.toFixed(6)}"/>
  <circle id="outline" r="${RADIUS.toFixed(6)}"/>
  <circle id="pupil" r="${(INNER / 2).toFixed(6)}"/>

  ${makeRays(8, TRUE_RADIUS - INNER - THICKNESS, INNER)}

  ${makePoints(8, TRUE_RADIUS, POINT_WIDTH, THICKNESS * 2)}
</g>
</svg>
`)

function makeRays (n, outer, inner, offset = 0) {
  return makeCorners(n, offset).map((theta) => makeRay(theta, outer, inner)).join('\n')
}

function makeRay (theta, outer, inner) {
  return `\t<line class="ray" ${linePoint(theta, outer, 1)} ${linePoint(theta, inner, 2)} />`
}

function makePoints (n, scale, width, size = THICKNESS, offset = 0) {
  return makeCorners(n, offset).map((theta) => {
    return makePoint(theta, scale, width, size)
  }).join('\n')
}

function makePoint (theta, scale, width, size = THICKNESS) {
  const pointX = (xAt(theta) * scale).toFixed(6)
  const leftX = (xAt(theta - width) * (scale - size)).toFixed(6)
  const rightX = (xAt(theta + width) * (scale - size)).toFixed(6)

  const pointY = (yAt(theta) * scale).toFixed(6)
  const leftY = (yAt(theta - width) * (scale - size)).toFixed(6)
  const rightY = (yAt(theta + width) * (scale - size)).toFixed(6)

  const path = `M ${leftX} ${leftY} L ${pointX} ${pointY} L ${rightX} ${rightY} Z`

  return `\t<path class="point" d="${path}" />`
}

function makeCorners (n, offset = 0) {
  const increment = 360 / n
  const corners = []
  for (let i = 0; i < n; i++) {
    corners.push(i * increment + offset)
  }

  return corners
}

function linePoint (theta, scale = 0, index = '') {
  return `x${index}="${(xAt(theta) * scale).toFixed(6)}" y${index}="${(yAt(theta) * scale).toFixed(6)}"`
}

/*
function makeDots (n, scale, offset = 0) {
  return makeCorners(n, offset).map((theta) => {
    return `\t<circle class="dot" r="${THICKNESS}" ${centerPoint(theta, scale)} />`
  }).join('\n')
}

function centerPoint (theta, scale = 0) {
  return `cx="${xAt(theta) * scale}" cy="${yAt(theta) * scale}"`
}
*/

function xAt (theta) {
  return Math.cos(toRad(theta))
}

function yAt (theta) {
  return Math.sin(toRad(theta))
}

function toRad (theta) {
  return Math.PI / 180 * theta
}
