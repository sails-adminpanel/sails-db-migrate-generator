import Base from "db-migrate-base";
import { IMSchema } from "../interfaces/types";
export default class DB {
    private readonly intermediateMigrationSchema;
    constructor();
    createTable(tableName: string, columnSpec: Base.CreateTableOptions, callback: any): void;
    addColumn(tableName: string, columnName: string, columnSpec: Base.ColumnSpec, callback: any): void;
    dropTable(tableName: string, callback: any): void;
    renameTable(tableName: string, newTableName: string, callback: any): void;
    removeColumn(tableName: string, columnName: string, callback: any): void;
    renameColumn(tableName: string, oldColumnName: string, newColumnName: string, callback: any): void;
    changeColumn(tableName: string, columnName: string, columnSpec: Base.ColumnSpec, callback: any): void;
    getWaterlineSchema(): IMSchema;
    processColumn(column: Base.ColumnSpec): Base.ColumnSpec;
}
