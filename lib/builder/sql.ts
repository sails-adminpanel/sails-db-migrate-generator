import * as fs from "fs";
import * as ejs from "ejs";
let migrationsPath = process.env.MIGRATIONS_PATH || `${process.cwd()}/migrations`;
let optionsWhiteList = ['type', 'length', 'primaryKey', 'autoIncrement', 'notNull', 'unique', 'defaultValue', 'foreignKey'];

export default class MigrationBuilder {
  private migrationsBuild;
  private modelsPrimaryKeysTypes;

  constructor(modelsPrimaryKeysTypes) {
    this.migrationsBuild = "";
    this.modelsPrimaryKeysTypes = modelsPrimaryKeysTypes;
  }

  public createTable(tableName, columnSpec) {
    for (let column in columnSpec) {
      column = this.processColumnName(column, columnSpec[column]);
      columnSpec[column] = this.processColumnSpec(tableName, column, columnSpec[column]);
    }
    this.migrationsBuild = this.migrationsBuild.concat(`db.createTable('${tableName}', {\n` +
      `    columns: ${JSON.stringify(columnSpec)},\n` +
      `    ifNotExists: true\n` +
      `  });\n`);
  }

  public addColumn(tableName, columnName, columnSpec) {
    columnName = this.processColumnName(columnName, columnSpec);
    columnSpec = this.processColumnSpec(tableName, columnName, columnSpec);
    this.migrationsBuild = this.migrationsBuild.concat(`db.addColumn('${tableName}', '${columnName}', ${JSON.stringify(columnSpec)});\n`);
  }

  public changeColumn(tableName, columnName, columnSpec) {
    columnName = this.processColumnName(columnName, columnSpec);
    columnSpec = this.processColumnSpec(tableName, columnName, columnSpec);
    this.migrationsBuild = this.migrationsBuild.concat(`db.changeColumn('${tableName}', '${columnName}', ${JSON.stringify(columnSpec)});\n`);
  }

  public dropTable(tableName) {
    this.migrationsBuild = this.migrationsBuild.concat(`db.dropTable('${tableName}');\n`);
  }

  public removeColumn(tableName, columnName) {
    this.migrationsBuild = this.migrationsBuild.concat(`db.removeColumn('${tableName}', '${columnName}');\n`);
  }

  public processColumnName(columnName, columnSpec) {
    for (let key in columnSpec) {
      if (key === 'columnName') {
        columnName = columnSpec[key];
      }
    }
    return columnName;
  }

  public processColumnSpec(tableName, columnName, columnSpec) {
    // process collections
    let tableFieldsType = 'string';
    if (this.modelsPrimaryKeysTypes[columnSpec.collection]) { // fields' types will be like primaryKey in related model
      tableFieldsType = this.modelsPrimaryKeysTypes[columnSpec.collection];
    }
    if (columnSpec.collection && !this.migrationsBuild.includes(`${columnSpec.collection}_${columnSpec.via}__${tableName}_${columnName}`)) {
      this.createTable(`${tableName}_${columnName}__${columnSpec.collection}_${columnSpec.via}`, {
        id: {type: 'int', notNull: true},
        [`${tableName}_${columnName}`]: {type: tableFieldsType},
        [`${columnSpec.collection}_${columnSpec.via}`]: {type: tableFieldsType}
      })
    }

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
    return columnSpec
  }

  public renderFile() {
    let date = new Date();
    let fileName = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}-migrations-generator-processed`;

    ejs.renderFile(__dirname + "./../templates/sql.ejs.js", {migration: this.migrationsBuild}, function (err, data) {
      if (err) {
        console.error(`Could not render migrations build`, err);
      } else {
        // console.log(data);
        fs.writeFileSync(`${migrationsPath}/${fileName}.js`, data);
      }
    })
  }

  public getMigrationsBuild() {
    return this.migrationsBuild;
  }
}

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}
