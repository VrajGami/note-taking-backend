// db.js
const { Pool } = require('pg');


const pool = new Pool({
    user: 'postgres', 
    host: 'localhost', 
    database: 'notes_app',
    password: 'password',
    port: 5432, 
  
});

module.exports = {
    query: (text, params) => {
        console.log('EXECUTING QUERY:', text);
        return pool.query(text, params);
    },
};