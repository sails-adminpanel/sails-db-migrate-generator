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
  db.addColumn('home', 'name', {
    type: 'string'
  }, callback);
  db.addColumn('home', 'number', {
    type: 'int'
  }, callback);
  db.dropTable('pet', callback);
  db.renameTable('home', 'house', callback);
  db.removeColumn('house', 'number', callback);
  db.renameColumn('house', 'name', 'address', callback);
  db.changeColumn('house', 'address', {
    type: 'json'
  }, callback);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
