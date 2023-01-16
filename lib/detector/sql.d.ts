import Base from "db-migrate-base";
import { IMSchema } from "../interfaces/types";
export default class DB {
    private readonly intermediateMigrationSchema;
    constructor();
    createTable(tableName: string, columnSpec: Base.CreateTableOptions): void;
    addColumn(tableName: string, columnName: string, columnSpec: Base.ColumnSpec): void;
    dropTable(tableName: string, options?: any): void;
    renameTable(tableName: string, newTableName: string): void;
    removeColumn(tableName: string, columnName: string): void;
    renameColumn(tableName: string, oldColumnName: string, newColumnName: string): void;
    changeColumn(tableName: string, columnName: string, columnSpec: Base.ColumnSpec): void;
    getWaterlineSchema(): IMSchema;
    processColumn(column: Base.ColumnSpec): Base.ColumnSpec;
}
