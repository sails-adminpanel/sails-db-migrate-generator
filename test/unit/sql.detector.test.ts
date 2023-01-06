import {expect} from "chai";
import DB from "../../lib/detector/sql";
import * as fs from "fs";
import * as path from "path";
describe('SQL detector test', function () {
  it('check detector proper work', async function() {
    let migrationsPath = path.resolve(__dirname, "../datamocks/migrations"); // process.env and in process.argv
    let migrationsDir = fs.readdirSync(migrationsPath);

    let db = new DB();
    for (let migrationFile of migrationsDir) {
      if (path.extname(migrationFile) === ".js") {
        try {
          // migrations filename should start from valid date and separator '-'
          if (isNaN(+migrationFile.split('-')[0]) || migrationFile.split('-')[0].length !== 14) {
            throw `${migrationFile} has invalid name`
          }
          let migration = require(`${migrationsPath}/${migrationFile}`);
          migration.up(db);
        } catch (e) {
          throw `Migration error > ${e}`
        }
      }
    }

    let migrationsSchema = db.getWaterlineSchema()
    expect(migrationsSchema).to.deep.equal({
      house: {
        id: { type: 'number', primaryKey: true, autoIncrement: true },
        address: { type: 'json' }
      }
    });
  });
});
