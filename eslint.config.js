const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expo,
  { ignores: ['dist/**', 'web-build/**', 'coverage/**', 'artifacts/**', '.expo/**'] },
  { rules: { 'no-console': 'error' } },
  { files: ['tests/performance/*.js'], languageOptions: { globals: { __ENV: 'readonly', open: 'readonly' } }, rules: { 'import/no-unresolved': 'off', 'import/extensions': 'off' } },
]);
