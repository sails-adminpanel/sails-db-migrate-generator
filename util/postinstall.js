let path = require("path");
let patchPackage = require("patch-package/dist/applyPatches")
var package = require(path.resolve(__dirname, "../fixture/package.json"));
process.chdir(path.resolve(__dirname, "../fixture"));
let dependencies = [];
for (let key in package.dependencies) {
  dependencies.push(`${key}@${package.dependencies[key]}`)
}

var npm = require("npm");
npm.load({
  loaded: false
}, function (err) {
  // catch errors
  npm.commands.install(dependencies, function (err, data) {
    // log the error or data
    const appPath = path.resolve(__dirname, "../fixture")
    const reverse = false
    const patchDir = "node_modules/dark-sails/"
    const shouldExitWithError  = false
    const shouldExitWithWarning = false

    patchPackage.applyPatchesForApp({
      appPath,
      reverse,
      patchDir,
      shouldExitWithError,
      shouldExitWithWarning }
    )
  });
  npm.on("log", function (message) {
    // log the progress of the installation
    console.log(message);
  });
});