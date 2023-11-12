import * as fs from "fs";
import * as path from "path";
import {ModelsTree} from "../interfaces/types";
import Base from "db-migrate-base";
const globalPrimaryKey = process.env.GLOBAL_PRIMARY_KEY ? process.env.GLOBAL_PRIMARY_KEY : "id";
const globalPrimaryKeyType = process.env.GLOBAL_PRIMARY_KEY_TYPE ? process.env.GLOBAL_PRIMARY_KEY_TYPE : "int";

export class ModelsHelper {
  public static buildTree(): {modelsTree: ModelsTree, modelsPrimaryKeysTypes: {[key:string]: string}} {
    let modelsPath = process.env.MODELS_PATH;
    let modelsDir = fs.readdirSync(modelsPath);

    let modelsTree = {};
    let modelsPrimaryKeysTypes = {}; // key: model, value: primaryKey type
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

        // if primary key was not found in model, use globalPrimaryKey
        if (!modelsPrimaryKeysTypes[path.basename(modelFile, path.extname(modelFile)).toLowerCase()] && model.attributes[globalPrimaryKey]) {
          modelsPrimaryKeysTypes[path.basename(modelFile, path.extname(modelFile)).toLowerCase()] = model.attributes[globalPrimaryKey].type;
        }

        modelsTree[path.basename(modelFile, path.extname(modelFile)).toLowerCase()] = model.attributes;
      }
    }

    return {modelsTree: modelsTree, modelsPrimaryKeysTypes: modelsPrimaryKeysTypes}
  }

  public static processTree(modelsTree: ModelsTree, modelsPrimaryKeysTypes: {[key:string]: string}): Base.ColumnSpec {
    let intermediateTables = {};
    let optionsWhiteList = ['type', 'length', 'primaryKey', 'autoIncrement', 'notNull', 'unique', 'defaultValue', 'foreignKey', 'model', 'collection', 'via'];

    // sort models in modelsTree to be sure that they are in alphabetical order
    const sortedModelsTree = {};
    Object.keys(modelsTree).sort().forEach(key => {
      sortedModelsTree[key] = modelsTree[key];
    });

    // sorted object can be used only here
    for (let model in sortedModelsTree) {
      for (let attribute in modelsTree[model]) {
        // process number to real (createdAt and updatedAt to bigint)
        if (modelsTree[model][attribute].type === 'number') {
          if (attribute === 'createdAt' || attribute === 'updatedAt') {
            modelsTree[model][attribute].type = 'bigint';
          } else if (modelsTree[model][attribute].autoIncrement) {
            modelsTree[model][attribute].type = 'int'
          } else {
            modelsTree[model][attribute].type = 'real';
          }
        }

        // process string to text
        if (modelsTree[model][attribute].type === 'string') {
          modelsTree[model][attribute].type = 'text';
        }

        // process attribute options
        for (let key in modelsTree[model][attribute]) {
          if (key === 'defaultsTo') {
            modelsTree[model][attribute]['defaultValue'] = modelsTree[model][attribute][key];
          }

          if (key === 'allowNull') {
            modelsTree[model][attribute]['notNull'] = !modelsTree[model][attribute][key];
          }

          if (key === 'columnType') {
            modelsTree[model][attribute]['type'] = modelsTree[model][attribute][key];
          }

          // delete all non-db-migrate options
          if (!optionsWhiteList.includes(key)) {
            delete modelsTree[model][attribute][key]
          }
        }

        // process collections
        if (modelsTree[model][attribute].collection) {
          let collectionPrimaryKeyType = globalPrimaryKeyType;
          let modelPrimaryKeyType = globalPrimaryKeyType;
          let attributeCollection = modelsTree[model][attribute].collection.toLowerCase();
          if (modelsPrimaryKeysTypes[attributeCollection]) { // type will be like primaryKey in related model (and they will be in lowerCase)
            if (modelsPrimaryKeysTypes[attributeCollection] === "number") {
              collectionPrimaryKeyType = "bigint";
            } else {
              collectionPrimaryKeyType = modelsPrimaryKeysTypes[attributeCollection];
            }
          }

          if (modelsPrimaryKeysTypes[model]) { // type will be like primaryKey in related model (and they will be in lowerCase)
            if (modelsPrimaryKeysTypes[model] === "number") {
              modelPrimaryKeyType = "bigint";
            } else {
              modelPrimaryKeyType = modelsPrimaryKeysTypes[model];
            }
          }

          if (!modelsTree[model][attribute].via) {
            modelsTree[model][attribute].via = modelsTree[attributeCollection].primaryKey as string || "id";
          }

          let attributeVia = modelsTree[model][attribute].via;

          // check if intermediate table does not exist
          if (!intermediateTables[`${attributeCollection}_${attributeVia}__${model}_${attribute}`.toLowerCase()]) {
            // get type of the association (many-to-many or one-to-many)
            let associationType = getCollectionAssociationType(modelsTree, attributeCollection, attributeVia);
            if (associationType === "many-to-many") {
              // create intermediate table for many-to-many association
              intermediateTables[`${model}_${attribute}__${attributeCollection}_${attributeVia}`.toLowerCase()] = {
                id: {type: 'int', autoIncrement: true},
                [`${model}_${attribute}`]: {type: modelPrimaryKeyType},
                [`${attributeCollection}_${attributeVia}`]: {type: collectionPrimaryKeyType}
              }
            } else {
              // don't do anything, intermediate table should not be created in one-to-many association
            }
          }

          delete modelsTree[model][attribute];
          continue
        }

        if (modelsTree[model][attribute].model) {
          // type will be like primaryKey in related model or string
          let modelPrimaryKeyType = globalPrimaryKeyType;

          if (modelsPrimaryKeysTypes[modelsTree[model][attribute].model]) {
            if (modelsPrimaryKeysTypes[modelsTree[model][attribute].model] === "number") {
              modelPrimaryKeyType = "bigint";
            } else {
              modelPrimaryKeyType = modelsPrimaryKeysTypes[modelsTree[model][attribute].model];
            }
          }

          modelsTree[model][attribute] = {type: modelPrimaryKeyType}
          continue
        }

        if (modelsTree[model][attribute].columnName) {
          modelsTree[model][modelsTree[model][attribute].columnName] = modelsTree[model][attribute];
          delete modelsTree[model][attribute];
        }
      }

      if (!modelsTree[model]['createdAt']) {
        modelsTree[model]['createdAt'] = {type: "bigint"}
      }

      if (!modelsTree[model]['updatedAt']) {
        modelsTree[model]['updatedAt'] = {type: "bigint"}
      }
    }

    return {...modelsTree, ...intermediateTables} as Base.ColumnSpec;
  }
}

// to transform fields like: ThisIsCamelCase => this_is_camel_case or thisIsCamelCase => this_is_camel_case
function camelToSnake(str) {
  return str.replace(/([A-Z])/g, match => "_" + match.toLowerCase()).replace(/^_/, '');
}

/**
 * Returns type of association the collection belongs to
 */
function getCollectionAssociationType(modelsTree: ModelsTree, collection: string, via: string): "many-to-many" | "one-to-many" {
  if (!modelsTree[collection][via]) {
    throw `Collection error: Attribute ${via} is not presented in model ${collection}`
  }

  if (modelsTree[collection][via].collection) {
    return "many-to-many"
  } else {
    return "one-to-many"
  }
}
