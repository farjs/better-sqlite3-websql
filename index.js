'use strict';

const customOpenDatabase = require('@expo/websql/custom');
const SQLiteDatabase = require('./SQLiteDatabase.js');

const openDatabase = customOpenDatabase(SQLiteDatabase);

module.exports = openDatabase;
