// database details holding the pokemon cards
const mysql = require("mysql2");
const db = mysql.createConnection({
    // connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: '40429391',
    port: '8889'
});

db.connect((err) => {
    if(err) throw err;
});

module.exports = db;