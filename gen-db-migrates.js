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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sql_1 = __importDefault(require("./lib/detector/sql"));
const sql_2 = __importDefault(require("./lib/builder/sql"));
const ModelsHelper_1 = require("./lib/helper/ModelsHelper");
// preparation to get Sails environment
let Sails = require(path.resolve(__dirname, "./fixture/node_modules/sails")).Sails;
function runSails() {
    require("./fixture/app-export");
    return new Promise((resolve, reject) => {
        Sails().lift({}, function (err, _sails) {
            if (err) {
                throw err;
            }
            // @ts-ignore
            global.sails = _sails;
            resolve(_sails);
        });
    });
}
async function genDBMigrates() {
    await runSails();
    // build models tree
    let modelsInfo = ModelsHelper_1.ModelsHelper.buildTree();
    let modelsTree = modelsInfo.modelsTree;
    let modelsPrimaryKeysTypes = modelsInfo.modelsPrimaryKeysTypes;
    // process models to tables
    let tablesTree = ModelsHelper_1.ModelsHelper.processTree(modelsTree, modelsPrimaryKeysTypes);
    // build migrations schema
    let migrationsPath = process.env.MIGRATIONS_PATH;
    let migrationsDir = fs.readdirSync(migrationsPath);
    let db = new sql_1.default();
    for (let migrationFile of migrationsDir) {
        if (path.extname(migrationFile) === ".js") {
            try {
                // migrations filename should start from valid date and separator '-'
                if (isNaN(+migrationFile.split('-')[0]) || migrationFile.split('-')[0].length !== 14) {
                    throw `${migrationFile} has invalid name`;
                }
                let migration = require(`${migrationsPath}/${migrationFile}`);
                migration.up(db);
            }
            catch (e) {
                console.log("Error while creating migration > ", e);
                process.exit(1);
            }
        }
    }
    let migrationsSchema = db.getWaterlineSchema();
    // compare models tree and migrations schema and create new migrations
    let migrationBuilder = new sql_2.default(migrationsSchema);
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
                    }
                    else {
                        migrationBuilder.addColumn(model, attribute, tablesTree[model][attribute]);
                    }
                }
            }
            else {
                migrationBuilder.createTable(model, tablesTree[model]);
            }
        }
        catch (e) {
            console.log(e);
            process.exit(1);
        }
    }
    for (let model in migrationsSchema) {
        if (!(model in tablesTree)) {
            migrationBuilder.dropTable(model);
        }
        else {
            for (let attribute in migrationsSchema[model]) {
                if (!(attribute in tablesTree[model])) {
                    migrationBuilder.removeColumn(model, attribute);
                }
            }
        }
    }
    migrationBuilder.renderFile();
}
exports.default = genDBMigrates;
