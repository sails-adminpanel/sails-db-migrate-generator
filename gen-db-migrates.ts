import * as fs from "fs";
import * as path from "path";
import DB from "./lib/detector/sql";
import MigrationBuilder from './lib/builder/sql';
import {ModelsHelper} from "./lib/helper/ModelsHelper";

// preparation to get Sails environment
let Sails = require(path.resolve(__dirname, "./fixture/node_modules/sails")).Sails;
function runSails() {
  return new Promise((resolve, reject) => {
    Sails().lift({}, function (err: any, _sails: any) {
      if (err) {
        throw err
      }
      // @ts-ignore
      global.sails = _sails;
      resolve(_sails);
    });
  })
}

export default async function genDBMigrates(): Promise<void> {
  await runSails();

  // build models tree
  let modelsInfo = ModelsHelper.buildTree();
  let modelsTree = modelsInfo.modelsTree;
  let modelsPrimaryKeysTypes = modelsInfo.modelsPrimaryKeysTypes;

  // process models to tables
  let tablesTree = ModelsHelper.processTree(modelsTree, modelsPrimaryKeysTypes);

  // build migrations schema
  let migrationsPath = process.env.MIGRATIONS_PATH;
  let migrationsDir = fs.readdirSync(migrationsPath);

  let db = new DB();
  for (let migrationFile of migrationsDir) {
    if (path.extname(migrationFile) === ".js") {
      try {
        // migrations filename should start from valid date and separator '-'
        if (isNaN(+migrationFile.split('-')[0]) || migrationFile.split('-')[0].length !== 14) {
          throw `${migrationFile} has invalid name`
        }
        let migration = require(`${migrationsPath}/${migrationFile}`);
        migration.up(db);
      } catch (e) {
        console.log("Error while creating migration > ", e)
        process.exit(1)
      }
    }
  }
  let migrationsSchema = db.getWaterlineSchema()

  // compare models tree and migrations schema and create new migrations
  let migrationBuilder = new MigrationBuilder(migrationsSchema);
  for (let model in tablesTree) {
    try {
      if (model in migrationsSchema) {
        for (let attribute in tablesTree[model]) {
          if (attribute in migrationsSchema[model]) {
            // check type
            if (tablesTree[model][attribute].type !== migrationsSchema[model][attribute].type) {
              migrationBuilder.changeColumn(model, attribute, tablesTree[model][attribute]);
            }
            // !TODO check other options
          } else {
            migrationBuilder.addColumn(model, attribute, tablesTree[model][attribute]);
          }
        }
      } else {
        migrationBuilder.createTable(model, tablesTree[model]);
      }
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  }

  for (let model in migrationsSchema) {
    if (!(model in tablesTree)) {
      migrationBuilder.dropTable(model)
    } else {
      for (let attribute in migrationsSchema[model]) {
        if (!(attribute in tablesTree[model])) {
          migrationBuilder.removeColumn(model, attribute)
        }
      }
    }
  }

  migrationBuilder.renderFile()
}
