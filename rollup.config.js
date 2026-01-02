import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/sandal.js',
  output: [
    {
      file: 'dist/sandal.js',
      format: 'umd',
      name: 'Sandal',
      sourcemap: true
    },
    {
      file: 'dist/sandal.min.js',
      format: 'umd',
      name: 'Sandal',
      plugins: [terser()],
      sourcemap: true
    },
    {
      file: 'dist/sandal.esm.js',
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [nodeResolve()]
};