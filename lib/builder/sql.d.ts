import Base from "db-migrate-base";
import { AttributeSpec, ModelSpec } from "../interfaces/types";
export default class MigrationBuilder {
    private migrationsBuild;
    private readonly modelsPrimaryKeysTypes;
    private modelsList;
    constructor(modelsPrimaryKeysTypes: any, modelsList: any);
    createTable(tableName: string, columnSpec: ModelSpec): void;
    addColumn(tableName: string, columnName: string, columnSpec: AttributeSpec): void;
    changeColumn(tableName: string, columnName: string, columnSpec: AttributeSpec): void;
    dropTable(tableName: string): void;
    removeColumn(tableName: string, columnName: string): void;
    processColumnName(columnName: string, columnSpec: AttributeSpec): string;
    processColumnSpec(tableName: string, columnName: string, columnSpec: AttributeSpec): Base.ColumnSpec;
    renderFile(): void;
    getMigrationsBuild(): string;
}
