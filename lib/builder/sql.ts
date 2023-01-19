import * as fs from "fs";
import * as ejs from "ejs";
import * as path from "path";
import Base from "db-migrate-base";
import {AttributeSpec, ModelSpec} from "../interfaces/types";
let optionsWhiteList = ['type', 'length', 'primaryKey', 'autoIncrement', 'notNull', 'unique', 'defaultValue', 'foreignKey'];

export default class MigrationBuilder {
  private migrationsBuild: string;
  private readonly modelsPrimaryKeysTypes: {[key:string]: string};
  private modelsList: string[];

  constructor(modelsPrimaryKeysTypes, modelsList) {
    this.migrationsBuild = "";
    this.modelsPrimaryKeysTypes = modelsPrimaryKeysTypes;
    this.modelsList = modelsList;
  }

  public createTable(tableName: string, columnSpec: ModelSpec): void {
    for (let column in columnSpec) {
      let processedColumnName = this.processColumnName(column, columnSpec[column]);
      columnSpec[column] = this.processColumnSpec(tableName, processedColumnName, columnSpec[column]);
      // do not create a migration if field is an association
      if (columnSpec[column] === null) {
        delete columnSpec[column]
      }
    }
    this.migrationsBuild = this.migrationsBuild.concat(`db.createTable('${tableName}', {\n` +
      `    columns: ${JSON.stringify(columnSpec, null, 4)},\n` +
      `    ifNotExists: true\n` +
      `  }, callback);\n`);
  }

  public addColumn(tableName: string, columnName: string, columnSpec: AttributeSpec): void {
    let processedColumnName = this.processColumnName(columnName, columnSpec);
    columnSpec = this.processColumnSpec(tableName, columnName, columnSpec);
    // do not create a migration if field is an association
    if (columnSpec === null) {
      return
    }
    this.migrationsBuild = this.migrationsBuild.concat(`db.addColumn('${tableName}', '${processedColumnName}', ${JSON.stringify(columnSpec)}, callback);\n`);
  }

  public changeColumn(tableName: string, columnName: string, columnSpec: AttributeSpec): void {
    let processedColumnName = this.processColumnName(columnName, columnSpec);
    columnSpec = this.processColumnSpec(tableName, columnName, columnSpec);
    // do not create a migration if field is an association
    if (columnSpec === null) {
      return
    }
    this.migrationsBuild = this.migrationsBuild.concat(`db.changeColumn('${tableName}', '${processedColumnName}', ${JSON.stringify(columnSpec)}, callback);\n`);
  }

  public dropTable(tableName: string): void {
    this.migrationsBuild = this.migrationsBuild.concat(`db.dropTable('${tableName}', callback);\n`);
  }

  public removeColumn(tableName: string, columnName: string): void {
    this.migrationsBuild = this.migrationsBuild.concat(`db.removeColumn('${tableName}', '${columnName}', callback);\n`);
  }

  public processColumnName(columnName: string, columnSpec: AttributeSpec): string {
    for (let key in columnSpec) {
      if (key === 'columnName') {
        columnName = columnSpec[key];
      }
    }
    return columnName;
  }

  public processColumnSpec(tableName: string, columnName: string, columnSpec: AttributeSpec): Base.ColumnSpec {
    // process collections
    if (columnSpec.collection) {
      // if (!this.modelsList.includes(columnSpec.collection)) {
      //   throw `Model ${tableName} has an association to model ${columnSpec.collection}, but model ${columnSpec.collection} is not presented in models tree`;
      // }

      // !TODO если нету columnSpec.via, то columnSpec.via = this.modelsPrimaryKeysTypes[columnSpec.collection];

      let tableFieldsType = 'string';
      if (this.modelsPrimaryKeysTypes[columnSpec.collection]) { // fields' types will be like primaryKey in related model
        tableFieldsType = this.modelsPrimaryKeysTypes[columnSpec.collection];
      }
      // db-migrate should check if intermediate table exists, then skip creating the table (ejs)
      // this case is only for outside model collection
      if (!this.migrationsBuild.includes(`${columnSpec.collection}_${columnSpec.via}__${tableName}_${columnName}`)) {
        this.createTable(`${tableName}_${columnName}__${columnSpec.collection}_${columnSpec.via}`, {
          id: {type: 'int', notNull: true, autoIncrement: true},
          [`${tableName}_${columnName}`]: {type: tableFieldsType},
          [`${columnSpec.collection}_${columnSpec.via}`]: {type: tableFieldsType}
        })
      }

      return null; // do not create a migration to this field
    }

    if (columnSpec.model) {
      return null; // do not create a migration to this field
    }

    // if (columnSpec.model && !this.modelsList.includes(columnSpec.model)) {
    //   throw `Model ${tableName} has an association to model ${columnSpec.model}, but model ${columnSpec.model} is not presented in models tree`;
    // }

    // process columnSpec options
    for (let key in columnSpec) {
      if (key === 'defaultsTo') {
        columnSpec['defaultValue'] = columnSpec[key];
      }

      if (key === 'allowNull') {
        columnSpec['notNull'] = !columnSpec[key];
      }

      if (key === 'columnType') {
        columnSpec.type = columnSpec[key];
      }

      // delete all non-db-migrate options
      if (!optionsWhiteList.includes(key)) {
        delete columnSpec[key]
      }
    }

    // process number to real (createdAt and updatedAt to bigint)
    if (columnSpec.type === 'number') {
      if (columnName === 'createdAt' || columnName === 'updatedAt') {
        columnSpec.type = 'bigint';
      } else {
        columnSpec.type = 'real';
      }
    }
    return columnSpec as Base.ColumnSpec
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
