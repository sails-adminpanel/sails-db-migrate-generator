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
}
exports.ModelsHelper = ModelsHelper;
