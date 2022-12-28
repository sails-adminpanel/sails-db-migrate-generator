let fs = require("fs");
let path = require("path");
let modelsPrimaryKeysTypes = {}; // key: model, value: primaryKey type
const DB = require("./lib/detector/sql").default;
const MigrationBuilder = require('./lib/builder/sql').default;

// build models tree
let modelsPath = process.env.MODELS_PATH || `${process.cwd()}/api/models`; // process.env and in process.argv
let modelsDir = fs.readdirSync(modelsPath);

let modelsTree = {}
for (let modelFile of modelsDir) {
  if (path.extname(modelFile) === ".js") {
    let model = require(`${modelsPath}/${modelFile}`);
    for (let attribute in model.attributes) {
      // process case "address: 'string'"
      if (typeof model.attributes[attribute] === 'string') {
        model.attributes[attribute] = {type: model.attributes[attribute]}
      }
      if (model.attributes[attribute].primaryKey) {
        modelsPrimaryKeysTypes[path.basename(modelFile, path.extname(modelFile)).toLowerCase()] = model.attributes[attribute].type;
      }
    }
    // add primary key to attribute options
    if (model.primaryKey) {
      model.attributes[model.primaryKey].primaryKey = true;
      modelsPrimaryKeysTypes[path.basename(modelFile, path.extname(modelFile)).toLowerCase()] = model.attributes[model.primaryKey].type;
    }
    modelsTree[path.basename(modelFile, path.extname(modelFile)).toLowerCase()] = model.attributes;
  }
}
console.log(modelsTree)

// build migrations schema
let migrationsPath = process.env.MIGRATIONS_PATH || `${process.cwd()}/migrations`;
let migrationsDir = fs.readdirSync(migrationsPath);

let db = new DB();
for (let migrationFile of migrationsDir) {
  if (path.extname(migrationFile) === ".js") {
    try {
      // migrations filename should start from valid date and separator '-'
      if (isNaN(migrationFile.split('-')[0]) || migrationFile.split('-')[0].length !== 14) {
        throw `${migrationFile} has invalid name`
      }
      let migration = require(`${migrationsPath}/${migrationFile}`);
      migration.up(db);
    } catch (e) {
      throw `Migration error: ${e}`
    }
  }
}

let migrationsSchema = db.getWaterlineSchema()
console.log(migrationsSchema)


// compare models tree and migrations schema and create new migrations
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

