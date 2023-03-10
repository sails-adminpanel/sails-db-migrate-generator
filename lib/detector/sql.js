"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DB {
    constructor() {
        this.intermediateMigrationSchema = {};
    }
    createTable(tableName, columnSpec, callback) {
        // !TODO process other parameters in columnSpec
        this.intermediateMigrationSchema[tableName] = {};
        let columns = columnSpec.columns ? columnSpec.columns : columnSpec;
        for (let key in columns) {
            this.intermediateMigrationSchema[tableName][key] = columns[key];
        }
        if (typeof callback === "function") {
            callback();
        }
    }
    addColumn(tableName, columnName, columnSpec, callback) {
        this.intermediateMigrationSchema[tableName][columnName] = columnSpec;
        if (typeof callback === "function") {
            callback();
        }
    }
    dropTable(tableName, callback) {
        // !TODO how to process this options ?
        // options will be an array, to process this case we need usage example
        // what means [options,] here: dropTable(tableName, [options,] callback) ?
        delete this.intermediateMigrationSchema[tableName];
        if (typeof callback === "function") {
            callback();
        }
    }
    renameTable(tableName, newTableName, callback) {
        this.intermediateMigrationSchema[newTableName] = this.intermediateMigrationSchema[tableName];
        delete this.intermediateMigrationSchema[tableName];
        if (typeof callback === "function") {
            callback();
        }
    }
    removeColumn(tableName, columnName, callback) {
        delete this.intermediateMigrationSchema[tableName][columnName];
        if (typeof callback === "function") {
            callback();
        }
    }
    renameColumn(tableName, oldColumnName, newColumnName, callback) {
        this.intermediateMigrationSchema[tableName][newColumnName] = this.intermediateMigrationSchema[tableName][oldColumnName];
        delete this.intermediateMigrationSchema[tableName][oldColumnName];
        if (typeof callback === "function") {
            callback();
        }
    }
    changeColumn(tableName, columnName, columnSpec, callback) {
        this.intermediateMigrationSchema[tableName][columnName] = columnSpec;
        if (typeof callback === "function") {
            callback();
        }
    }
    // !TODO add all other methods
    getWaterlineSchema() {
        return this.intermediateMigrationSchema;
    }
}
exports.default = DB;
