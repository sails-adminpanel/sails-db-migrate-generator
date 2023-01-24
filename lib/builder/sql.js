"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const ejs = __importStar(require("ejs"));
const path = __importStar(require("path"));
class MigrationBuilder {
    constructor(migrationsSchema) {
        this.migrationsBuild = "";
        this.migrationsSchema = migrationsSchema;
    }
    createTable(tableName, columnSpec, withoutTimeFields = false) {
        if (!withoutTimeFields) {
            if (!columnSpec.createdAt) {
                columnSpec.createdAt = { type: "bigint" };
            }
            if (!columnSpec.updatedAt) {
                columnSpec.updatedAt = { type: "bigint" };
            }
        }
        this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.createTable('${tableName}', {\n` +
            `    columns: ${JSON.stringify(columnSpec, null, 4)},\n` +
            `    ifNotExists: true\n` +
            `  }, cb),\n`);
    }
    addColumn(tableName, columnName, columnSpec) {
        this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.addColumn('${tableName}', '${columnName}', ${JSON.stringify(columnSpec)}, cb),\n`);
    }
    changeColumn(tableName, columnName, columnSpec) {
        this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.changeColumn('${tableName}', '${columnName}', ${JSON.stringify(columnSpec)}, cb),\n`);
    }
    dropTable(tableName) {
        this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.dropTable('${tableName}', cb),\n`);
    }
    removeColumn(tableName, columnName) {
        this.migrationsBuild = this.migrationsBuild.concat(`(cb) => db.removeColumn('${tableName}', '${columnName}', cb),\n`);
    }
    renderFile() {
        let date = new Date();
        let fileName = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}-${process.env.MIGRATION_NAME}`;
        ejs.renderFile(path.resolve(__dirname, "./../templates/sql.ejs.js"), { migration: this.migrationsBuild }, function (err, data) {
            if (err) {
                console.error(`Could not render migrations build`, err);
            }
            else {
                // console.log(data);
                fs.writeFileSync(`${process.env.MIGRATIONS_PATH}/${fileName}.js`, data);
            }
        });
    }
    getMigrationsBuild() {
        return this.migrationsBuild;
    }
}
exports.default = MigrationBuilder;
function pad2(n) {
    return (n < 10 ? '0' : '') + n;
}
