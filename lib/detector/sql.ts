export default class DB {
  private waterlineSchema;

  constructor() {
    this.waterlineSchema = {}
  }

  public createTable(tableName, columnSpec, callback) {
    // !TODO process other parameters in columnSpec
    this.waterlineSchema[tableName] = {};
    let columns = columnSpec.columns ? columnSpec.columns : columnSpec;
    for (let key in columns) {
      this.waterlineSchema[tableName][key] = this.processColumn(columns[key]);
    }
  }

  public addColumn(tableName, columnName, columnSpec, callback) {
    this.waterlineSchema[tableName][columnName] = this.processColumn(columnSpec);
  }

  public dropTable(tableName, options, callback) {
    // !TODO how to process this options ?
    // options will be an array, to process this case we need usage example
    // what means [options,] here: dropTable(tableName, [options,] callback) ?
    delete this.waterlineSchema[tableName];
  }

  public renameTable(tableName, newTableName, callback) {
    this.waterlineSchema[newTableName] = this.waterlineSchema[tableName];
    delete this.waterlineSchema[tableName];
  }

  public removeColumn(tableName, columnName, callback) {
    delete this.waterlineSchema[tableName][columnName];
  }

  public renameColumn(tableName, oldColumnName, newColumnName, callback) {
    this.waterlineSchema[tableName][newColumnName] = this.waterlineSchema[tableName][oldColumnName];
    delete this.waterlineSchema[tableName][oldColumnName];
  }

  public changeColumn(tableName, columnName, columnSpec, callback) {
    this.waterlineSchema[tableName][columnName] = this.processColumn(columnSpec);
  }

  // !TODO add all other methods

  public getWaterlineSchema() {
    return this.waterlineSchema;
  }

  public processColumn(column) {
    if (column.type === 'char' || column.type === 'text' || column.type === 'date' || column.type === 'datetime' ||
      column.type === 'time' || column.type === 'blob' || column.type === 'binary') {
      column.type = 'string';
    }

    if (column.type === 'smallint' || column.type === 'bigint' || column.type === 'int' ||
      column.type === 'real' || column.type === 'timestamp' || column.type === 'decimal') {
      column.type = 'number';
    }
    return column
  }
}
