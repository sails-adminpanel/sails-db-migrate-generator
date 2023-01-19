/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('@sailshq/lodash');
let fs = require("fs");
let genDBMigrates = require("./gen-db-migrates").default;


/**
 * sails-db-migrate-generator
 *
 * Usage:
 * `sails generate sails-db-migrate-generator`
 *
 * @description Generates a sails-db-migrate-generator.
 * @docs https://sailsjs.com/docs/concepts/extending-sails/generators/custom-generators
 */

module.exports = {

  /**
   * `before()` is run before executing any of the `targets`
   * defined below.
   *
   * This is where we can validate user input, configure default
   * scope variables, get extra dependencies, and so on.
   *
   * @param  {Dictionary} scope
   * @param  {Function} done
   */

  before: async function (scope, done) {
    if (!process.env.MIGRATION_NAME) {
      process.env.MIGRATION_NAME = scope.args[0] ? scope.args[0] : "migrations-generator-processed";
    }

    if (!process.env.MODELS_PATH || !process.env.MIGRATIONS_PATH) {
      for (let arg of process.argv) {
        if (!process.env.MODELS_PATH && arg.startsWith("--modelsPath")) {
          process.env.MODELS_PATH = arg.split("=")[1];
        }
        if (!process.env.MIGRATIONS_PATH && arg.startsWith("--migrationsPath")) {
          process.env.MIGRATIONS_PATH = arg.split("=")[1];
        }
      }
    }

    if (!process.env.MODELS_PATH) {
      process.env.MODELS_PATH = `${process.cwd()}/api/models`;
    }

    if (!process.env.MIGRATIONS_PATH) {
      process.env.MIGRATIONS_PATH = `${process.cwd()}/migrations`;
    }

    if (!fs.existsSync(process.env.MODELS_PATH) || !fs.existsSync(process.env.MIGRATIONS_PATH)) {
      console.log("Models and migrations paths should exist")
      process.exit(1);
    }

    await genDBMigrates();

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    // When finished, trigger the `done` callback to begin generating
    // files/folders as specified by the `targets` below.
    //
    // > Or call `done()` with an Error for first argument to signify a fatal error
    // > and halt generation of all targets.
    return done();
  },



  /**
   * The files/folders to generate.
   * @type {Dictionary}
   */
  targets: {

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // • e.g. create a folder:
    // ```
    // './hey_look_a_folder': { folder: {} }
    // ```
    //
    // • e.g. create a dynamically-named file relative to `scope.rootPath`
    // (defined by the `filename` scope variable).
    //
    // The `template` helper reads the specified template, making the
    // entire scope available to it (uses underscore/JST/ejs syntax).
    // Then the file is copied into the specified destination (on the left).
    // ```
    // './:filename': { template: 'example.template.js' },
    // ```
    //
    // • See https://sailsjs.com/docs/concepts/extending-sails/generators for more documentation.
    // (Or visit https://sailsjs.com/support and talk to a maintainer of a core or community generator.)
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  },


  /**
   * The absolute path to the `templates` for this generator
   * (for use with the `template` and `copy` builtins)
   *
   * @type {String}
   */
  templatesDirectory: path.resolve(__dirname, './templates')

};
