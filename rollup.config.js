import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const version = pkg.version;

// Banner with version number
const banner = `/*!
 * SandalJS v${version}
 * Copyright (c) ${new Date().getFullYear()} Ready Intelligence
 * Released under the MIT License
 */`;

export default [
  {
    input: 'src/sandal.js',
    output: [
      {
        file: `dist/sandal-${version}.js`,
        format: 'umd',
        name: 'Sandal',
        banner,
        sourcemap: true
      },
      {
        file: `dist/sandal-${version}.min.js`,
        format: 'umd',
        name: 'Sandal',
        banner,
        sourcemap: true,
        plugins: [terser({ format: { comments: /^!/ } })]
      }
    ],
    plugins: [nodeResolve()]
  },
  {
    input: 'src/sandal.js',
    output: {
      file: `dist/sandal-${version}.esm.js`,
      format: 'es',
      banner,
      sourcemap: true
    },
    plugins: [nodeResolve()]
  }
];
