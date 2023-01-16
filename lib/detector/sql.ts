import Base from "db-migrate-base";
import {IMSchema} from "../interfaces/types";

export default class DB {
  private readonly intermediateMigrationSchema: IMSchema;

  constructor() {
    this.intermediateMigrationSchema = {}
  }

  public createTable(tableName: string, columnSpec: Base.CreateTableOptions): void {
    // !TODO process other parameters in columnSpec
    this.intermediateMigrationSchema[tableName] = {};
    let columns = columnSpec.columns ? columnSpec.columns : columnSpec;
    for (let key in columns) {
      this.intermediateMigrationSchema[tableName][key] = this.processColumn(columns[key]);
    }
  }

  public addColumn(tableName: string, columnName: string, columnSpec: Base.ColumnSpec): void {
    this.intermediateMigrationSchema[tableName][columnName] = this.processColumn(columnSpec);
  }

  public dropTable(tableName: string, options?): void {
    // !TODO how to process this options ?
    // options will be an array, to process this case we need usage example
    // what means [options,] here: dropTable(tableName, [options,] callback) ?
    delete this.intermediateMigrationSchema[tableName];
  }

  public renameTable(tableName: string, newTableName: string): void {
    this.intermediateMigrationSchema[newTableName] = this.intermediateMigrationSchema[tableName];
    delete this.intermediateMigrationSchema[tableName];
  }

  public removeColumn(tableName: string, columnName: string): void {
    delete this.intermediateMigrationSchema[tableName][columnName];
  }

  public renameColumn(tableName: string, oldColumnName: string, newColumnName: string): void {
    this.intermediateMigrationSchema[tableName][newColumnName] = this.intermediateMigrationSchema[tableName][oldColumnName];
    delete this.intermediateMigrationSchema[tableName][oldColumnName];
  }

  public changeColumn(tableName: string, columnName: string, columnSpec: Base.ColumnSpec) {
    this.intermediateMigrationSchema[tableName][columnName] = this.processColumn(columnSpec);
  }

  // !TODO add all other methods

  public getWaterlineSchema(): IMSchema {
    return this.intermediateMigrationSchema;
  }

  public processColumn(column: Base.ColumnSpec): Base.ColumnSpec {
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
