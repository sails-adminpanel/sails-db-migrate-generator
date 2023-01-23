"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const sql_1 = require("./lib/detector/sql");
const sql_2 = require("./lib/builder/sql");
const ModelsHelper_1 = require("./lib/helper/ModelsHelper");
// preparation to get Sails environment
let Sails = require(path.resolve(__dirname, "./fixture/node_modules/sails")).Sails;
function runSails() {
    return new Promise((resolve, reject) => {
        require("./fixture/app-export");
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
    let migrationBuilder = new sql_2.default(modelsPrimaryKeysTypes, Object.keys(modelsTree));
    for (let model in modelsTree) {
        try {
            if (model in migrationsSchema) {
                for (let attribute in modelsTree[model]) {
                    if (attribute in migrationsSchema[model]) {
                        // check type
                        if (modelsTree[model][attribute].type !== migrationsSchema[model][attribute].type) {
                            migrationBuilder.changeColumn(model, attribute, modelsTree[model][attribute]);
                        }
                        // !TODO check other options
                    }
                    else {
                        migrationBuilder.addColumn(model, attribute, modelsTree[model][attribute]);
                    }
                }
            }
            else {
                migrationBuilder.createTable(model, modelsTree[model]);
            }
        }
        catch (e) {
            console.log(e);
            process.exit(1);
        }
    }
    for (let model in migrationsSchema) {
        if (!(model in modelsTree)) {
            migrationBuilder.dropTable(model);
        }
        else {
            for (let attribute in migrationsSchema[model]) {
                if (!(attribute in modelsTree[model])) {
                    migrationBuilder.removeColumn(model, attribute);
                }
            }
        }
    }
    migrationBuilder.renderFile();
}
exports.default = genDBMigrates;
