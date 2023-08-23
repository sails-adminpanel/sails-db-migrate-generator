import * as fs from "fs";
import * as path from "path";
import {ModelsTree} from "../interfaces/types";
import Base from "db-migrate-base";

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
        modelsTree[path.basename(modelFile, path.extname(modelFile)).toLowerCase()] = model.attributes;
      }
    }

    return {modelsTree: modelsTree, modelsPrimaryKeysTypes: modelsPrimaryKeysTypes}
  }

  public static processTree(modelsTree, modelsPrimaryKeysTypes): Base.ColumnSpec {
    let intermediateTables = {};
    let optionsWhiteList = ['type', 'length', 'primaryKey', 'autoIncrement', 'notNull', 'unique', 'defaultValue', 'foreignKey', 'model', 'collection', 'via'];

    for (let model in modelsTree) {
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
          let tableFieldsType = 'string';
          let attributeCollection = modelsTree[model][attribute].collection.toLowerCase();
          let attributeVia = modelsTree[model][attribute].via;
          if (modelsPrimaryKeysTypes[attributeCollection]) { // fields' types will be like primaryKey in related model (and they will be in lowerCase)
            if (modelsPrimaryKeysTypes[attributeCollection] === "number") {
              tableFieldsType = "bigint";
            } else {
              tableFieldsType = modelsPrimaryKeysTypes[attributeCollection];
            }
          }

          if (!modelsTree[model][attribute].via) {
            modelsTree[model][attribute].via = modelsTree[attributeCollection].primaryKey || "id";
          }

          if (!intermediateTables[`${attributeCollection}_${attributeVia}__${model}_${attribute}`.toLowerCase()]) {
            intermediateTables[`${model}_${attribute}__${attributeCollection}_${attributeVia}`.toLowerCase()] = {
              id: {type: 'int', notNull: true, autoIncrement: true},
              [`${model}_${attribute}`]: {type: tableFieldsType},
              [`${attributeCollection}_${attributeVia}`]: {type: tableFieldsType}
            }
          }

          delete modelsTree[model][attribute];
          continue
        }

        if (modelsTree[model][attribute].model) {
          delete modelsTree[model][attribute];
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

