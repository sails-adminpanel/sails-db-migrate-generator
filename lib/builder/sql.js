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
const fs = __importStar(require("fs"));
const ejs = __importStar(require("ejs"));
const path = __importStar(require("path"));
let optionsWhiteList = ['type', 'length', 'primaryKey', 'autoIncrement', 'notNull', 'unique', 'defaultValue', 'foreignKey'];
class MigrationBuilder {
    constructor(modelsPrimaryKeysTypes, modelsList, migrationsSchema) {
        this.migrationsBuild = "";
        this.modelsPrimaryKeysTypes = modelsPrimaryKeysTypes;
        this.modelsList = modelsList;
        this.migrationsSchema = migrationsSchema;
    }
    createTable(tableName, columnSpec, withoutTimeFields = false) {
        for (let column in columnSpec) {
            let processedColumnName = this.processColumnName(column, columnSpec[column]);
            columnSpec[column] = this.processColumnSpec(tableName, processedColumnName, columnSpec[column]);
            // do not create a migration if field is an association
            if (columnSpec[column] === null) {
                delete columnSpec[column];
            }
        }
        if (!withoutTimeFields) {
            if (!columnSpec.createdAt) {
                columnSpec.createdAt = { type: "bigint" };
            }
            if (!columnSpec.updatedAt) {
                columnSpec.updatedAt = { type: "bigint" };
            }
        }
        this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.createTable('${tableName}', {\n` +
            `    columns: ${JSON.stringify(columnSpec, null, 4)},\n` +
            `    ifNotExists: true\n` +
            `  }, cb),\n`);
    }
    addColumn(tableName, columnName, columnSpec) {
        let processedColumnName = this.processColumnName(columnName, columnSpec);
        columnSpec = this.processColumnSpec(tableName, columnName, columnSpec);
        // do not create a migration if field is an association
        if (columnSpec === null) {
            return;
        }
        this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.addColumn('${tableName}', '${processedColumnName}', ${JSON.stringify(columnSpec)}, cb),\n`);
    }
    changeColumn(tableName, columnName, columnSpec) {
        let processedColumnName = this.processColumnName(columnName, columnSpec);
        columnSpec = this.processColumnSpec(tableName, columnName, columnSpec);
        // do not create a migration if field is an association
        if (columnSpec === null) {
            return;
        }
        this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.changeColumn('${tableName}', '${processedColumnName}', ${JSON.stringify(columnSpec)}, cb),\n`);
    }
    dropTable(tableName) {
        this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.dropTable('${tableName}', cb),\n`);
    }
    removeColumn(tableName, columnName) {
        this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.removeColumn('${tableName}', '${columnName}', cb),\n`);
    }
    processColumnName(columnName, columnSpec) {
        for (let key in columnSpec) {
            if (key === 'columnName') {
                columnName = columnSpec[key];
            }
        }
        return columnName;
    }
    processColumnSpec(tableName, columnName, columnSpec) {
        // process collections
        if (columnSpec.collection) {
            // if (!this.modelsList.includes(columnSpec.collection)) {
            //   throw `Model ${tableName} has an association to model ${columnSpec.collection}, but model ${columnSpec.collection} is not presented in models tree`;
            // }
            // !TODO если нету columnSpec.via, то columnSpec.via = this.modelsPrimaryKeysTypes[columnSpec.collection];
            let tableFieldsType = 'string';
            if (this.modelsPrimaryKeysTypes[columnSpec.collection]) { // fields' types will be like primaryKey in related model
                tableFieldsType = this.modelsPrimaryKeysTypes[columnSpec.collection];
            }
            // db-migrate should check if intermediate table exists, then skip creating the table (ejs)
            // this case is only for outside model collection
            let tableAlreadyInSchema = false;
            if (`${tableName}_${columnName}__${columnSpec.collection}_${columnSpec.via}` in this.migrationsSchema ||
                `${columnSpec.collection}_${columnSpec.via}__${tableName}_${columnName}` in this.migrationsSchema) {
                tableAlreadyInSchema = true;
            }
            if (!this.migrationsBuild.includes(`${columnSpec.collection}_${columnSpec.via}__${tableName}_${columnName}`) && !tableAlreadyInSchema) {
                this.createTable(`${tableName}_${columnName}__${columnSpec.collection}_${columnSpec.via}`, {
                    id: { type: 'int', notNull: true, autoIncrement: true },
                    [`${tableName}_${columnName}`]: { type: tableFieldsType },
                    [`${columnSpec.collection}_${columnSpec.via}`]: { type: tableFieldsType }
                }, true);
            }
            return null; // do not create a migration to this field
        }
        if (columnSpec.model) {
            return null; // do not create a migration to this field
        }
        // if (columnSpec.model && !this.modelsList.includes(columnSpec.model)) {
        //   throw `Model ${tableName} has an association to model ${columnSpec.model}, but model ${columnSpec.model} is not presented in models tree`;
        // }
        // process columnSpec options
        for (let key in columnSpec) {
            if (key === 'defaultsTo') {
                columnSpec['defaultValue'] = columnSpec[key];
            }
            if (key === 'allowNull') {
                columnSpec['notNull'] = !columnSpec[key];
            }
            if (key === 'columnType') {
                columnSpec.type = columnSpec[key];
            }
            // delete all non-db-migrate options
            if (!optionsWhiteList.includes(key)) {
                delete columnSpec[key];
            }
        }
        // process number to real (createdAt and updatedAt to bigint)
        if (columnSpec.type === 'number') {
            if (columnName === 'createdAt' || columnName === 'updatedAt') {
                columnSpec.type = 'bigint';
            }
            else if (columnSpec.autoIncrement) {
                columnSpec.type = 'int';
            }
            else {
                columnSpec.type = 'real';
            }
        }
        return columnSpec;
    }
    renderFile() {
        let date = new Date();
        let fileName = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}-${process.env.MIGRATION_NAME}`;
        ejs.renderFile(path.resolve(__dirname, "./../templates/sql.ejs.js"), { migration: this.migrationsBuild }, function (err, data) {
            if (err) {
                console.error(`Could not render migrations build`, err);
            }
            else {
                // console.log(data);
                fs.writeFileSync(`${process.env.MIGRATIONS_PATH}/${fileName}.js`, data);
            }
        });
    }
    getMigrationsBuild() {
        return this.migrationsBuild;
    }
}
exports.default = MigrationBuilder;
function pad2(n) {
    return (n < 10 ? '0' : '') + n;
}
