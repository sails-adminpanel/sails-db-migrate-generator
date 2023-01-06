import * as fs from "fs";
import * as path from "path";

export class ModelsHelper {
  public static buildTree() {
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
}
