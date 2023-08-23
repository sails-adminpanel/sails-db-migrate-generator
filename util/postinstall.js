const path = require("path");
const { applyPatchesForApp } = require("patch-package");
const { readFileSync } = require('fs');
const packageJsonPath = path.resolve(__dirname, "../fixture/package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
process.chdir(path.resolve(__dirname, "../fixture"));
const dependencies = Object.keys(packageJson.dependencies).map(key => `${key}@${packageJson.dependencies[key]}`);

const npm = require("npm");
npm.load({
  loaded: false
}, function (err) {
  if (err) {
    console.error(err);
    return;
  }

  // Перенесено наверх, после npm.load
  npm.commands.install(dependencies, function (err, data) {
    if (err) {
      console.error(err);
      return;
    }
    
    const appPath = path.resolve(__dirname, "../fixture");
    const reverse = false;
    const patchDir = "node_modules/dark-sails/";
    const shouldExitWithError = false;
    const shouldExitWithWarning = false;

    applyPatchesForApp({
      appPath,
      reverse,
      patchDir,
      shouldExitWithError,
      shouldExitWithWarning
    });
  });

  npm.on("log", function (message) {
    console.log(message);
  });
});
