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
            this.intermediateMigrationSchema[tableName][key] = this.processColumn(columns[key]);
        }
        callback();
    }
    addColumn(tableName, columnName, columnSpec, callback) {
        this.intermediateMigrationSchema[tableName][columnName] = this.processColumn(columnSpec);
        callback();
    }
    dropTable(tableName, callback) {
        // may be dropTable(tableName, options, callback)
        // !TODO how to process this options ?
        // options will be an array, to process this case we need usage example
        // what means [options,] here: dropTable(tableName, [options,] callback) ?
        delete this.intermediateMigrationSchema[tableName];
        callback();
    }
    renameTable(tableName, newTableName, callback) {
        this.intermediateMigrationSchema[newTableName] = this.intermediateMigrationSchema[tableName];
        delete this.intermediateMigrationSchema[tableName];
        callback();
    }
    removeColumn(tableName, columnName, callback) {
        delete this.intermediateMigrationSchema[tableName][columnName];
        callback();
    }
    renameColumn(tableName, oldColumnName, newColumnName, callback) {
        this.intermediateMigrationSchema[tableName][newColumnName] = this.intermediateMigrationSchema[tableName][oldColumnName];
        delete this.intermediateMigrationSchema[tableName][oldColumnName];
        callback();
    }
    changeColumn(tableName, columnName, columnSpec, callback) {
        this.intermediateMigrationSchema[tableName][columnName] = this.processColumn(columnSpec);
        callback();
    }
    // !TODO add all other methods
    getWaterlineSchema() {
        return this.intermediateMigrationSchema;
    }
    processColumn(column) {
        if (column.type === 'char' || column.type === 'text' || column.type === 'date' || column.type === 'datetime' ||
            column.type === 'time' || column.type === 'blob' || column.type === 'binary') {
            column.type = 'string';
        }
        if (column.type === 'smallint' || column.type === 'bigint' || column.type === 'int' ||
            column.type === 'real' || column.type === 'timestamp' || column.type === 'decimal') {
            column.type = 'number';
        }
        return column;
    }
}
exports.default = DB;
