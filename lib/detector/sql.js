"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DB {
    constructor() {
        this.waterlineSchema = {};
    }
    createTable(tableName, columnSpec, callback) {
        // !TODO process other parameters in columnSpec
        this.waterlineSchema[tableName] = {};
        let columns = columnSpec.columns ? columnSpec.columns : columnSpec;
        for (let key in columns) {
            this.waterlineSchema[tableName][key] = this.processColumn(columns[key]);
        }
    }
    addColumn(tableName, columnName, columnSpec, callback) {
        this.waterlineSchema[tableName][columnName] = this.processColumn(columnSpec);
    }
    dropTable(tableName, options, callback) {
        // !TODO how to process this options ?
        // options will be an array, to process this case we need usage example
        // what means [options,] here: dropTable(tableName, [options,] callback) ?
        delete this.waterlineSchema[tableName];
    }
    renameTable(tableName, newTableName, callback) {
        this.waterlineSchema[newTableName] = this.waterlineSchema[tableName];
        delete this.waterlineSchema[tableName];
    }
    removeColumn(tableName, columnName, callback) {
        delete this.waterlineSchema[tableName][columnName];
    }
    renameColumn(tableName, oldColumnName, newColumnName, callback) {
        this.waterlineSchema[tableName][newColumnName] = this.waterlineSchema[tableName][oldColumnName];
        delete this.waterlineSchema[tableName][oldColumnName];
    }
    changeColumn(tableName, columnName, columnSpec, callback) {
        this.waterlineSchema[tableName][columnName] = this.processColumn(columnSpec);
    }
    // !TODO add all other methods
    getWaterlineSchema() {
        return this.waterlineSchema;
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
