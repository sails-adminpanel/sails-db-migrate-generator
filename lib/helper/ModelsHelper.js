"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelsHelper = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ModelsHelper {
    static buildTree() {
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
                        model.attributes[attribute] = { type: model.attributes[attribute] };
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
        return { modelsTree: modelsTree, modelsPrimaryKeysTypes: modelsPrimaryKeysTypes };
    }
    static processTree(modelsTree, modelsPrimaryKeysTypes) {
        let intermediateTables = {};
        let optionsWhiteList = ['type', 'length', 'primaryKey', 'autoIncrement', 'notNull', 'unique', 'defaultValue', 'foreignKey', 'model', 'collection', 'via'];
        for (let model in modelsTree) {
            for (let attribute in modelsTree[model]) {
                // process number to real (createdAt and updatedAt to bigint)
                if (modelsTree[model][attribute].type === 'number') {
                    if (attribute === 'createdAt' || attribute === 'updatedAt') {
                        modelsTree[model][attribute].type = 'bigint';
                    }
                    else if (modelsTree[model][attribute].autoIncrement) {
                        modelsTree[model][attribute].type = 'int';
                    }
                    else {
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
                        delete modelsTree[model][attribute][key];
                    }
                }
                // process collections
                if (modelsTree[model][attribute].collection) {
                    let tableFieldsType = 'string';
                    if (modelsPrimaryKeysTypes[modelsTree[model][attribute].collection]) { // fields' types will be like primaryKey in related model
                        if (modelsPrimaryKeysTypes[modelsTree[model][attribute].collection] === "number") {
                            tableFieldsType = "bigint";
                        }
                        else {
                            tableFieldsType = modelsPrimaryKeysTypes[modelsTree[model][attribute].collection];
                        }
                    }
                    if (!modelsTree[model][attribute].via) {
                        modelsTree[model][attribute].via = modelsTree[modelsTree[model][attribute].collection].primaryKey || "id";
                    }
                    if (!intermediateTables[`${modelsTree[model][attribute].collection}_${modelsTree[model][attribute].via}__${model}_${attribute}`]) {
                        intermediateTables[`${model}_${attribute}__${modelsTree[model][attribute].collection}_${modelsTree[model][attribute].via}`] = {
                            id: { type: 'int', notNull: true, autoIncrement: true },
                            [`${model}_${attribute}`]: { type: tableFieldsType },
                            [`${modelsTree[model][attribute].collection}_${modelsTree[model][attribute].via}`]: { type: tableFieldsType }
                        };
                    }
                    delete modelsTree[model][attribute];
                    continue;
                }
                if (modelsTree[model][attribute].model) {
                    delete modelsTree[model][attribute];
                    continue;
                }
                if (modelsTree[model][attribute].columnName) {
                    modelsTree[model][modelsTree[model][attribute].columnName] = modelsTree[model][attribute];
                    delete modelsTree[model][attribute];
                }
            }
            if (!modelsTree[model]['createdAt']) {
                modelsTree[model]['createdAt'] = { type: "bigint" };
            }
            if (!modelsTree[model]['updatedAt']) {
                modelsTree[model]['updatedAt'] = { type: "bigint" };
            }
        }
        return { ...modelsTree, ...intermediateTables };
    }
}
exports.ModelsHelper = ModelsHelper;
