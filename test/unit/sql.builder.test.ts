import {expect} from "chai";
import * as path from "path";
import * as DBMigrate from 'db-migrate';
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
process.env.MIGRATION_NAME = "test"
process.env.MIGRATIONS_PATH = path.resolve(__dirname, "../.tmp/migrations");
import MigrationBuilder from "../../lib/builder/sql";

describe('SQL builder test', function () {
  it('check builder proper work', async function() {
    // clear .tmp/migrations
    if (fs.existsSync(path.resolve(__dirname, "../.tmp"))) {
      fs.rmSync(path.resolve(__dirname, "../.tmp"), { recursive: true, force: true });
    }
    fs.mkdirSync(path.resolve(__dirname, "../.tmp"));
    fs.mkdirSync(path.resolve(__dirname, "../.tmp/migrations"));
    fs.copyFileSync(path.resolve(__dirname, "../datamocks/migrations/20221214141948-init.js"),
      path.resolve(__dirname, "../.tmp/migrations/20221214141948-init.js"));
    fs.copyFileSync(path.resolve(__dirname, "../datamocks/migrations/20221214142409-home-add-address.js"),
      path.resolve(__dirname, "../.tmp/migrations/20221214142409-home-add-address.js"));
    fs.copyFileSync(path.resolve(__dirname, "../datamocks/migrations/20221214142410-home-rename-address.js"),
      path.resolve(__dirname, "../.tmp/migrations/20221214142410-home-rename-address.js"));

    let migrationBuilder = new MigrationBuilder(modelsPrimaryKeysTypes, Object.keys(modelsTree));
    for (let model in modelsTree) {
      if (model in migrationsSchema) {
        for (let attribute in modelsTree[model]) {
          if (attribute in migrationsSchema[model]) {
            // check type
            if (modelsTree[model][attribute].type !== migrationsSchema[model][attribute].type) {
              migrationBuilder.changeColumn(model, attribute, modelsTree[model][attribute]);
            }
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

    let migrationsDir = fs.readdirSync(path.resolve(__dirname, "../.tmp/migrations"));
    // migrations filename should start from valid date and separator '-'
    let migrationProperName = true;
    for (let i = 0; i < migrationsDir.length; i++) {
      if (isNaN(+migrationsDir[i].split('-')[0]) || migrationsDir[i].split('-')[0].length !== 14) {
        migrationProperName = false
      }
    }

    // getting an instance of dbmigrate
    let dbmigrate = DBMigrate.getInstance(true, {
      cwd: path.resolve(__dirname, "../.tmp"),
      config: path.resolve(__dirname, "../datamocks/database.json")
    });

    // function runMigrations() {
    //   return new Promise((resolve, reject) => {
    //     try {
    //       //execute any of the API methods
    //       dbmigrate.reset()
    //         .then( () => dbmigrate.up() );
    //     } catch (e) {
    //       throw e
    //     }
    //   })
    // }
    //
    // await runMigrations();

    expect(migrationProperName).to.be.true;
    expect(migrationBuilder.getMigrationsBuild()).to.equal("db.addColumn('home', 'geo_position', {\"type\":\"json\"});\n" +
      "db.addColumn('home', 'livingSpace', {\"type\":\"real\"});\n" +
      "db.createTable('home_pets__pet_home', {\n" +
      "    columns: {\n" +
      "    \"id\": {\n" +
      "        \"type\": \"int\",\n" +
      "        \"notNull\": true,\n" +
      "        \"autoIncrement\": true\n" +
      "    },\n" +
      "    \"home_pets\": {\n" +
      "        \"type\": \"string\"\n" +
      "    },\n" +
      "    \"pet_home\": {\n" +
      "        \"type\": \"string\"\n" +
      "    }\n" +
      "},\n" +
      "    ifNotExists: true\n" +
      "  });\n" +
      "db.createTable('home_tenants__user_home', {\n" +
      "    columns: {\n" +
      "    \"id\": {\n" +
      "        \"type\": \"int\",\n" +
      "        \"notNull\": true,\n" +
      "        \"autoIncrement\": true\n" +
      "    },\n" +
      "    \"home_tenants\": {\n" +
      "        \"type\": \"string\"\n" +
      "    },\n" +
      "    \"user_home\": {\n" +
      "        \"type\": \"string\"\n" +
      "    }\n" +
      "},\n" +
      "    ifNotExists: true\n" +
      "  });\n" +
      "db.createTable('pet_owners__user_pets', {\n" +
      "    columns: {\n" +
      "    \"id\": {\n" +
      "        \"type\": \"int\",\n" +
      "        \"notNull\": true,\n" +
      "        \"autoIncrement\": true\n" +
      "    },\n" +
      "    \"pet_owners\": {\n" +
      "        \"type\": \"string\"\n" +
      "    },\n" +
      "    \"user_pets\": {\n" +
      "        \"type\": \"string\"\n" +
      "    }\n" +
      "},\n" +
      "    ifNotExists: true\n" +
      "  });\n" +
      "db.createTable('pet', {\n" +
      "    columns: {\n" +
      "    \"breed\": {\n" +
      "        \"type\": \"string\"\n" +
      "    },\n" +
      "    \"type\": {\n" +
      "        \"type\": \"string\"\n" +
      "    },\n" +
      "    \"name\": {\n" +
      "        \"type\": \"string\"\n" +
      "    }\n" +
      "},\n" +
      "    ifNotExists: true\n" +
      "  });\n" +
      "db.createTable('user', {\n" +
      "    columns: {\n" +
      "    \"id\": {\n" +
      "        \"type\": \"string\",\n" +
      "        \"primaryKey\": true\n" +
      "    },\n" +
      "    \"firstName\": {\n" +
      "        \"type\": \"string\"\n" +
      "    },\n" +
      "    \"lastName\": {\n" +
      "        \"type\": \"string\"\n" +
      "    },\n" +
      "    \"age\": {\n" +
      "        \"type\": \"real\",\n" +
      "        \"autoIncrement\": true\n" +
      "    },\n" +
      "    \"email\": {\n" +
      "        \"type\": \"string\",\n" +
      "        \"unique\": true\n" +
      "    }\n" +
      "},\n" +
      "    ifNotExists: true\n" +
      "  });\n")
  })
});
