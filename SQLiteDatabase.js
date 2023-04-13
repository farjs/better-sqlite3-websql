'use strict';

const Database = require("@farjs/better-sqlite3-wrapper");
const SQLiteResult = require('@expo/websql/lib/sqlite/SQLiteResult');

const READ_ONLY_ERROR = new Error('could not prepare statement (23 not authorized)');
  
function SQLiteDatabase(name) {
    const db = new Database(name);
    db._lastInsertRowIdQuery = db.prepare("SELECT last_insert_rowid() AS id;");
    db._changesQuery = db.prepare("SELECT changes() AS changes;");
    this._db = db;
}

function runSelect(db, sql, args, cb) {
    let err;
    let resultSet;
    try {
        const rows = db.prepare(sql).all(args);
        
        const insertId = undefined;
        const rowsAffected = 0;
        resultSet = new SQLiteResult(null, insertId, rowsAffected, rows);
    }
    catch (e) {
        err = e;
    }

    if (err) {
        return cb(new SQLiteResult(err));
    }
    cb(resultSet);
}

function runNonSelect(db, sql, args, cb) {
    let err;
    let resultSet;
    try {
        db.prepare(sql).run(args);

        const insertId = db._lastInsertRowIdQuery.get().id;
        const rowsAffected = db._changesQuery.get().changes;
        const rows = [];
        resultSet = new SQLiteResult(null, insertId, rowsAffected, rows);
    }
    catch (e) {
        err = e;
    }

    if (err) {
        return cb(new SQLiteResult(err));
    }
    cb(resultSet);
}

SQLiteDatabase.prototype.exec = function exec(queries, readOnly, callback) {
    const db = this._db;
    const len = queries.length;
    const results = new Array(len);

    var i = 0;

    function checkDone() {
        if (++i === len) {
            callback(null, results);
        } else {
            doNext();
        }
    }

    function onQueryComplete(i) {
        return function (res) {
            results[i] = res;
            checkDone();
        };
    }

    function doNext() {
        const query = queries[i];
        const sql = query.sql;
        const args = query.args;

        // We try to sniff whether it's a SELECT query or not.
        // This is inherently error-prone, although it will probably work in the 99%
        // case.
        const isSelect = /^\s*SELECT\b/i.test(sql);

        if (readOnly && !isSelect) {
            onQueryComplete(i)(new SQLiteResult(READ_ONLY_ERROR));
        } else if (isSelect) {
            runSelect(db, sql, args, onQueryComplete(i));
        } else {
            runNonSelect(db, sql, args, onQueryComplete(i));
        }
    }

    doNext();
};

module.exports = SQLiteDatabase;
