#!/usr/bin/env node
import * as fs from 'node:fs/promises'

const packageData = await fs.readFile('./package.json', 'utf8')

const json = JSON.parse(packageData)

const { name, version, dependencies } = json

console.log('Updating version.js with latest package', { name, version, dependencies })

const fileContents = `
export const name = '${name}'
export const version = '${version}'
export const dependencies = ${JSON.stringify(dependencies, null, '  ')}
`

await fs.writeFile('./app/version.js', fileContents)

console.log('Done!')
