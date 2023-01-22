let path = require("path");
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
  });
  npm.on("log", function (message) {
    // log the progress of the installation
    console.log(message);
  });
});
