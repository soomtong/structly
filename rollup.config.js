import sourcemaps from 'rollup-plugin-sourcemaps';
import nodeResolve from 'rollup-plugin-node-resolve';
import nodeGlobals from 'rollup-plugin-node-globals';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';

export default {
  moduleName: 'Structly',
  moduleId: 'structly',
  entry: 'dist/index.js',
  dest: 'dist/structly.umd.js',
  format: 'umd',
  sourceMap: true,
  plugins: [
    sourcemaps(),
    nodeResolve({ jsnext: true }),
    nodeGlobals(),
    nodeBuiltins(),
    commonjs(),
    uglify()
  ]
};
