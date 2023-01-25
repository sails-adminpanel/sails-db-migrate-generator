#!/usr/bin/env node
let fs = require("fs");
let path = require("path");
let cwd = process.cwd();
process.chdir(cwd);

for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === "-h" || process.argv[i] === "--help") {
    console.log("To generate migration use the following command:\n" +
      "\nsails migrate migration-label --modelsPath=\"./models\" --migrationsPath=\"./migrations\n" +
      "\nParameters:\n" +
      "- migration-label (optional), default: \"migrations-generator-processed\"\n" +
      "- migrationsPath (optional), default: \"./migrations\"\n" +
      "- modelsPath (optional), default: \"./models\"")
    process.exit(0);
  }
  if (process.argv[i] === "-v" || process.argv[i] === "--version") {
    let packageJSON = require(path.resolve(__dirname, "./package.json"));
    console.log(packageJSON.version);
    process.exit(0);
  }
  if (!process.env.MIGRATION_NAME && ((process.argv[i].endsWith("bin") || process.argv[i].endsWith("sails-migrate"))
    && (i+1 < process.argv.length) && !process.argv[i+1].startsWith("--"))) {
    process.env.MIGRATION_NAME = process.argv[i+1];
  }
  if (!process.env.MODELS_PATH && process.argv[i].startsWith("--modelsPath")) {
    process.env.MODELS_PATH = process.argv[i].split("=")[1];
  }
  if (!process.env.MIGRATIONS_PATH && process.argv[i].startsWith("--migrationsPath")) {
    process.env.MIGRATIONS_PATH = process.argv[i].split("=")[1];
  }
}

if (!process.env.MIGRATION_NAME) {
  process.env.MIGRATION_NAME = "migrations-generator-processed";
}

if (!process.env.MODELS_PATH) {
  process.env.MODELS_PATH = `${process.cwd()}/models`;
}

if (!process.env.MIGRATIONS_PATH) {
  process.env.MIGRATIONS_PATH = `${process.cwd()}/migrations`;
}

if (!fs.existsSync(process.env.MIGRATIONS_PATH)) {
  fs.mkdirSync(process.env.MIGRATIONS_PATH);
}

if (!fs.existsSync(process.env.MODELS_PATH)) {
  console.log("Models and migrations paths should exist")
  process.exit(1);
}

if (!fs.existsSync(path.resolve(__dirname, "./fixture/node_modules"))) {
  require("./util/postinstall", function() {
    run()
  });
} else {
  run()
}

async function run() {
  let genDBMigrates = require("./gen-db-migrates").default;
  await genDBMigrates();
  process.exit(0);
}
