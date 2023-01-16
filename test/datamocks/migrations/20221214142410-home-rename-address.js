'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  db.renameTable('home', 'house', callback);
  db.renameTable('house', 'home', callback);
  db.removeColumn('home', 'number', callback);
  db.renameColumn('home', 'name', 'address', callback);
  db.changeColumn('home', 'address', {
    type: 'json'
  }, callback);
  db.changeColumn('home', 'address', {
    type: 'string'
  }, callback);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
