const openDatabase = require('./index');

const assert = require('assert').strict;
const it = function() {
    return process['isBun'] ? test : require('node:test').it;
}();

//given
const db = openDatabase(":memory:", '1.0', 'description', 1);

it('should write to database', async () => {
    //when
    const result = await new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(`
                create table test(
                    id     integer primary key,
                    name   text not null
                );
            `, [], (tx, r) => {
                const insertSql = "insert into test (name) values (?);"
                tx.executeSql(insertSql, ["test1"], (tx, r) => {
                    tx.executeSql(insertSql, ["test2"], (tx, r) => {
                        resolve(r);
                    }, (tx, e) => {
                        reject(e);
                    });
                }, (tx, e) => {
                    reject(e);
                });
            }, (tx, e) => {
                reject(e);
            });
        });

    });

    //then
    assert.deepEqual(result.insertId, 2);
    assert.deepEqual(result.rowsAffected, 1);
    assert.deepEqual(result.rows._array, []);
});

it('should read all records from database', async () => {
    //when
    const result = await new Promise((resolve, reject) => {
        db.readTransaction((tx) => {
            tx.executeSql("select * from test order by id;", [], (tx, r) => {
                resolve(r);
            }, (tx, e) => {
                reject(e);
            });
        });

    });

    //then
    assert.deepEqual(result.insertId, undefined);
    assert.deepEqual(result.rowsAffected, 0);
    assert.deepEqual(result.rows._array, [{
        id: 1,
        name: "test1"
    }, {
        id: 2,
        name: "test2"
    }]);
});

it('should read record by id from database', async () => {
    //when
    const result = await new Promise((resolve, reject) => {
        db.readTransaction((tx) => {
            tx.executeSql("select * from test where id=?;", [2], (tx, r) => {
                resolve(r);
            }, (tx, e) => {
                reject(e);
            });
        });

    });

    //then
    assert.deepEqual(result.insertId, undefined);
    assert.deepEqual(result.rowsAffected, 0);
    assert.deepEqual(result.rows._array, [{
        id: 2,
        name: "test2"
    }]);
});
