#!/usr/bin/env node
let fs = require("fs");
let cwd = process.cwd();
let genDBMigrates = require("./gen-db-migrates").default;
process.chdir(cwd);

for (let i = 0; i < process.argv.length; i++) {
  if (!process.env.MIGRATION_NAME) {
    if ((process.argv[i].endsWith("bin") || process.argv[i].endsWith("sails-migrate")) && (i+1 < process.argv.length) &&
      !process.argv[i+1].startsWith("--")) {
      process.env.MIGRATION_NAME = process.argv[i+1]
    } else {
      process.env.MIGRATION_NAME = "migrations-generator-processed";
    }
  }
  if (!process.env.MODELS_PATH) {
    if (process.argv[i].startsWith("--modelsPath")) {
      process.env.MODELS_PATH = process.argv[i].split("=")[1];
    } else {
      process.env.MODELS_PATH = `${process.cwd()}/models`;
    }
  }
  if (!process.env.MIGRATIONS_PATH) {
    if (process.argv[i].startsWith("--migrationsPath")) {
      process.env.MIGRATIONS_PATH = process.argv[i].split("=")[1];
    } else {
      process.env.MIGRATIONS_PATH = `${process.cwd()}/migrations`;
    }
  }
}

if (!fs.existsSync(process.env.MIGRATIONS_PATH)) {
  fs.mkdirSync(process.env.MIGRATIONS_PATH);
}

if (!fs.existsSync(process.env.MODELS_PATH)) {
  console.log("Models and migrations paths should exist")
  process.exit(1);
}

await genDBMigrates();
