import {expect} from "chai";
import * as path from "path";
let modelsTree = require("../datamocks/modelsTree.json");
import * as fs from "fs";
import * as process from "process";
let modelsPrimaryKeysTypes = {"home": "number", "user": "string"};
let migrationsSchema = {
  home: {
    id: { type: 'number', primaryKey: true, autoIncrement: true },
    address: { type: 'string' }
  }
}
process.env.MIGRATIONS_PATH = path.resolve(__dirname, "../temp/migrations");
process.env.MIGRATION_NAME = "test"
import MigrationBuilder from "../../lib/builder/sql";

describe('SQL builder test', function () {
  it('check builder proper work', async function() {
    // clear temp/migrations
    let migrationsDir = fs.readdirSync(process.env.MIGRATIONS_PATH);
    for (let migrationFile of migrationsDir) {
      fs.unlinkSync(`${process.env.MIGRATIONS_PATH}/${migrationFile}`);
    }

    let migrationBuilder = new MigrationBuilder(modelsPrimaryKeysTypes);
    for (let model in modelsTree) {
      if (model in migrationsSchema) {
        for (let attribute in modelsTree[model]) {
          if (attribute in migrationsSchema[model]) {
            // check type
            if (modelsTree[model][attribute].type !== migrationsSchema[model][attribute].type) {
              migrationBuilder.changeColumn(model, attribute, modelsTree[model][attribute]);
            }
            // !TODO check other options
          } else {
            migrationBuilder.addColumn(model, attribute, modelsTree[model][attribute]);
          }
        }
      } else {
        migrationBuilder.createTable(model, modelsTree[model]);
      }
    }

    for (let model in migrationsSchema) {
      if (!(model in modelsTree)) {
        migrationBuilder.dropTable(model)
      } else {
        for (let attribute in migrationsSchema[model]) {
          if (!(attribute in modelsTree[model])) {
            migrationBuilder.removeColumn(model, attribute)
          }
        }
      }
    }

    migrationBuilder.renderFile()

    migrationsDir = fs.readdirSync(process.env.MIGRATIONS_PATH);
    // migrations filename should start from valid date and separator '-'
    let migrationProperName = true;
    if (isNaN(+migrationsDir[0].split('-')[0]) || migrationsDir[0].split('-')[0].length !== 14) {
      migrationProperName = false
    }

    expect(migrationProperName).to.be.true;
    expect(migrationBuilder.getMigrationsBuild()).to.equal("db.addColumn('home', 'geo_position', {\"type\":\"json\"});\n" +
      "db.addColumn('home', 'livingSpace', {\"type\":\"float\"});\n" +
      "db.createTable('home_pets__pet_home', {\n" +
      "    columns: {\"id\":{\"type\":\"int\",\"notNull\":true},\"home_pets\":{\"type\":\"string\"},\"pet_home\":{\"type\":\"string\"}},\n" +
      "    ifNotExists: true\n" +
      "  });\n" +
      "db.addColumn('home', 'pets', {});\n" +
      "db.createTable('home_tenants__user_home', {\n" +
      "    columns: {\"id\":{\"type\":\"int\",\"notNull\":true},\"home_tenants\":{\"type\":\"string\"},\"user_home\":{\"type\":\"string\"}},\n" +
      "    ifNotExists: true\n" +
      "  });\n" +
      "db.addColumn('home', 'tenants', {});\n" +
      "db.addColumn('home', 'owner', {});\n" +
      "db.createTable('pet_owners__user_pets', {\n" +
      "    columns: {\"id\":{\"type\":\"int\",\"notNull\":true},\"pet_owners\":{\"type\":\"string\"},\"user_pets\":{\"type\":\"string\"}},\n" +
      "    ifNotExists: true\n" +
      "  });\n" +
      "db.createTable('pet', {\n" +
      "    columns: {\"breed\":{\"type\":\"string\"},\"type\":{\"type\":\"string\"},\"name\":{\"type\":\"string\"},\"owners\":{},\"home\":{}},\n" +
      "    ifNotExists: true\n" +
      "  });\n" +
      "db.createTable('user', {\n" +
      "    columns: {\"id\":{\"type\":\"string\",\"primaryKey\":true},\"firstName\":{\"type\":\"string\"},\"lastName\":{\"type\":\"string\"},\"age\":{\"type\":\"real\",\"autoIncrement\":true},\"email\":{\"type\":\"string\",\"unique\":true},\"pets\":{},\"home\":{}},\n" +
      "    ifNotExists: true\n" +
      "  });\n")
  })
});
