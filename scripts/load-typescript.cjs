/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const cache = new Map();

function resolveSource(value) {
  const candidates = [value, `${value}.ts`, `${value}.tsx`, path.join(value, 'index.ts')];
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function loadFile(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  if (!/\.tsx?$/.test(filename)) return require(filename);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  cache.set(filename, mod);
  const nativeRequire = mod.require.bind(mod);
  mod.require = (id) => {
    let resolved;
    if (id.startsWith('@/')) resolved = resolveSource(path.join(root, 'src', id.slice(2)));
    else if (id.startsWith('.')) resolved = resolveSource(path.resolve(path.dirname(filename), id));
    return resolved && /\.tsx?$/.test(resolved) ? loadFile(resolved) : nativeRequire(id);
  };
  try {
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    mod._compile(output, filename);
    return mod.exports;
  } catch (error) { cache.delete(filename); throw error; }
}

function loadTypeScript(relativePath) {
  const filename = resolveSource(path.resolve(root, relativePath));
  if (!filename || !filename.startsWith(root + path.sep)) throw new Error('Invalid integration module path');
  return loadFile(filename);
}

module.exports = { loadTypeScript };
