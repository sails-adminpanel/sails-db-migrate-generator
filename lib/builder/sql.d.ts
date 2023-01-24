import { AttributeSpec, ModelSpec } from "../interfaces/types";
export default class MigrationBuilder {
    private migrationsBuild;
    private readonly migrationsSchema;
    constructor(migrationsSchema: any);
    createTable(tableName: string, columnSpec: ModelSpec): void;
    addColumn(tableName: string, columnName: string, columnSpec: AttributeSpec): void;
    changeColumn(tableName: string, columnName: string, columnSpec: AttributeSpec): void;
    dropTable(tableName: string): void;
    removeColumn(tableName: string, columnName: string): void;
    renderFile(): void;
    getMigrationsBuild(): string;
}
