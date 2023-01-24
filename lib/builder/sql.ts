import * as fs from "fs";
import * as ejs from "ejs";
import * as path from "path";
import Base from "db-migrate-base";
import {AttributeSpec, ModelSpec} from "../interfaces/types";

export default class MigrationBuilder {
  private migrationsBuild: string;
  private readonly migrationsSchema;

  constructor(migrationsSchema) {
    this.migrationsBuild = "";
    this.migrationsSchema = migrationsSchema;
  }

  public createTable(tableName: string, columnSpec: ModelSpec, withoutTimeFields = false): void {
    if (!withoutTimeFields) {
      if (!columnSpec.createdAt) {
        columnSpec.createdAt = {type: "bigint"}
      }
      if (!columnSpec.updatedAt) {
        columnSpec.updatedAt = {type: "bigint"}
      }
    }

    this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.createTable('${tableName}', {\n` +
      `    columns: ${JSON.stringify(columnSpec, null, 4)},\n` +
      `    ifNotExists: true\n` +
      `  }, cb),\n`);
  }

  public addColumn(tableName: string, columnName: string, columnSpec: AttributeSpec): void {
    this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.addColumn('${tableName}', '${columnName}', ${JSON.stringify(columnSpec)}, cb),\n`);
  }

  public changeColumn(tableName: string, columnName: string, columnSpec: AttributeSpec): void {
    this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.changeColumn('${tableName}', '${columnName}', ${JSON.stringify(columnSpec)}, cb),\n`);
  }

  public dropTable(tableName: string): void {
    this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.dropTable('${tableName}', cb),\n`);
  }

  public removeColumn(tableName: string, columnName: string): void {
    this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.removeColumn('${tableName}', '${columnName}', cb),\n`);
  }

  public renderFile(): void {
    let date = new Date();
    let fileName = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}-${process.env.MIGRATION_NAME}`;

    ejs.renderFile(path.resolve(__dirname, "./../templates/sql.ejs.js"), {migration: this.migrationsBuild}, function (err, data) {
      if (err) {
        console.error(`Could not render migrations build`, err);
      } else {
        // console.log(data);
        fs.writeFileSync(`${process.env.MIGRATIONS_PATH}/${fileName}.js`, data);
      }
    })
  }

  public getMigrationsBuild(): string {
    return this.migrationsBuild;
  }
}

function pad2(n: number): string {
  return (n < 10 ? '0' : '') + n;
}
