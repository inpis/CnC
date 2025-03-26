
const express = require('express');
const mysql = require('mysql');


// database connection and query promisify
var conn = mysql.createPool({
    host     : 'ilaundry.cfywee4se8j2.ap-south-1.rds.amazonaws.com',
    user     : 'admin',
    password : 'Ira060623',
    database : 'iLaundry_db',
    connectionLimit : 100
  });


  const mySqlQury =(qry)=>{
    return new Promise((resolve, reject)=>{
        conn.query(qry, (err, row)=>{
            if (err) return reject(err);
            resolve(row)
        })
    }) 
  } 

  
  module.exports = {conn, mySqlQury}