'use strict';

var async = require('async');
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
  async.series([
    (cb) => db.addColumn('home', 'address', {
      type: 'string'
    }, cb),
    (cb) => db.dropTable('pet', cb),
  ], callback)
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
