import * as fs from "fs";
import * as path from "path";
import {ModelsTree} from "../interfaces/types";

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

  public static processTree(modelsTree, modelsPrimaryKeysTypes, migrationsSchema): ModelsTree {
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
          console.log(attribute)
          let tableFieldsType = 'string';
          if (modelsPrimaryKeysTypes[modelsTree[model][attribute].collection]) { // fields' types will be like primaryKey in related model
            tableFieldsType = modelsPrimaryKeysTypes[modelsTree[model][attribute].collection];
          }

          if (!modelsTree[model][attribute].via) {
            modelsTree[model][attribute].via = modelsTree[modelsTree[model][attribute].collection].primaryKey || "id";
          }

          if (!intermediateTables[`${modelsTree[model][attribute].collection}_${modelsTree[model][attribute].via}__${model}_${attribute}`]) {
            intermediateTables[`${model}_${attribute}__${modelsTree[model][attribute].collection}_${modelsTree[model][attribute].via}`] = {
              id: {type: 'int', notNull: true, autoIncrement: true},
              [`${model}_${attribute}`]: {type: tableFieldsType},
              [`${modelsTree[model][attribute].collection}_${modelsTree[model][attribute].via}`]: {type: tableFieldsType}
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

    return {...modelsTree, ...intermediateTables};
  }
}
