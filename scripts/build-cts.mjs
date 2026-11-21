// Generate dist/packet.d.cts for CommonJS consumers from the ESM declarations.
// The UMD build sets `module.exports = Packet`, so CommonJS types need `export = Packet`,
// with the exported types moved onto a namespace merged with the class.
import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync('dist/packet.d.ts', 'utf8');
const types = [];

const body = source
  .replace(/^export type (\w+) = (.+);$/gm, (_, name, value) => {
    types.push(`    type ${name} = ${value};`);
    return `type ${name} = ${value};`;
  })
  .replace(/^export default class Packet\b/m, 'declare class Packet');

if (!/^declare class Packet\b/m.test(body) || /^export /m.test(body)) {
  throw new Error('Unexpected shape in dist/packet.d.ts; update scripts/build-cts.mjs');
}

const namespace = types.length
  ? `declare namespace Packet {\n${types.map((line) => line.replace(/^ {4}type/, '  export type')).join('\n')}\n}\n`
  : '';

writeFileSync('dist/packet.d.cts', `${body.trimEnd()}\n${namespace}export = Packet;\n`);
