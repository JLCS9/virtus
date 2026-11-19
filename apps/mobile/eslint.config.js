// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // src/web/ es copia de la web (scripts/sync-web.mjs): se revisa en su propio repo.
    ignores: ["dist/*", "src/web/*"],
  }
]);
