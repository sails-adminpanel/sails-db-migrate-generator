"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
let optionsWhiteList = ['type', 'length', 'primaryKey', 'autoIncrement', 'notNull', 'unique', 'defaultValue', 'foreignKey'];
class MigrationBuilder {
    constructor(modelsPrimaryKeysTypes) {
        this.migrationsBuild = "";
        this.modelsPrimaryKeysTypes = modelsPrimaryKeysTypes;
    }
    createTable(tableName, columnSpec) {
        for (let column in columnSpec) {
            let processedColumnName = this.processColumnName(column, columnSpec[column]);
            columnSpec[column] = this.processColumnSpec(tableName, processedColumnName, columnSpec[column]);
        }
        this.migrationsBuild = this.migrationsBuild.concat(`db.createTable('${tableName}', {\n` +
            `    columns: ${JSON.stringify(columnSpec)},\n` +
            `    ifNotExists: true\n` +
            `  });\n`);
    }
    addColumn(tableName, columnName, columnSpec) {
        let processedColumnName = this.processColumnName(columnName, columnSpec);
        columnSpec = this.processColumnSpec(tableName, columnName, columnSpec);
        this.migrationsBuild = this.migrationsBuild.concat(`db.addColumn('${tableName}', '${processedColumnName}', ${JSON.stringify(columnSpec)});\n`);
    }
    changeColumn(tableName, columnName, columnSpec) {
        let processedColumnName = this.processColumnName(columnName, columnSpec);
        columnSpec = this.processColumnSpec(tableName, columnName, columnSpec);
        this.migrationsBuild = this.migrationsBuild.concat(`db.changeColumn('${tableName}', '${processedColumnName}', ${JSON.stringify(columnSpec)});\n`);
    }
    dropTable(tableName) {
        this.migrationsBuild = this.migrationsBuild.concat(`db.dropTable('${tableName}');\n`);
    }
    removeColumn(tableName, columnName) {
        this.migrationsBuild = this.migrationsBuild.concat(`db.removeColumn('${tableName}', '${columnName}');\n`);
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
            let tableFieldsType = 'string';
            if (this.modelsPrimaryKeysTypes[columnSpec.collection]) { // fields' types will be like primaryKey in related model
                tableFieldsType = this.modelsPrimaryKeysTypes[columnSpec.collection];
            }
            if (!this.migrationsBuild.includes(`${columnSpec.collection}_${columnSpec.via}__${tableName}_${columnName}`)) {
                this.createTable(`${tableName}_${columnName}__${columnSpec.collection}_${columnSpec.via}`, {
                    id: { type: 'int', notNull: true },
                    [`${tableName}_${columnName}`]: { type: tableFieldsType },
                    [`${columnSpec.collection}_${columnSpec.via}`]: { type: tableFieldsType }
                });
            }
        }
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
