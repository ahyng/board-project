const config = require("./config/key.js");
const mongoclient = require('mongodb').MongoClient;
const url = config.mongoURI
let mydb;
mongoclient.connect(url)
  .then(client => {
    mydb = client.db('board');
    // mydb.collection('post').find().toArray().then(result => {
    //   console.log(result);
    // })

    app.listen(8080, () => {
      console.log('port 8080...');
    });
  }).catch(err => {
    console.log(err);
  })

// var mysql = require('mysql')
// var conn = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "abcd",
//   database: "myboard",
// });

// conn.connect();

const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
// const db = require('node-mysql/lib/db');
// const { mongo } = require('mongoose');
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  })

app.get('/book', (req, res) => {
    res.sendFile(__dirname + '/book.html');
})

app.get('/list', (req, res) => {
  // conn.query("select * from post", function(err, rows, fields){
  //   if (err) throw err;
  //   res.render('list.ejs', {data : rows});
  // })

  mydb.collection('post').find().toArray().then(result => {
    console.log(result);
    res.render('list.ejs', {data : result});
  })
  
})

app.get('/enter', (req, res) => {
  res.render('enter.ejs');
})

app.post('/save', (req, res) => {
  console.log(req.body.title);
  console.log(req.body.content);
  console.log(req.body.someDate);

  mydb.collection('post').insertOne(
    {title : req.body.title, content: req.body.content, date: req.body.someDate}
  ).then(result => {
    console.log(result);
    console.log('데이터 추가 성공');
  })
  res.send('데이터 추가 성공');

  //mysql
  // let sql = "insert into post (title, content, created) values(?, ?, NOW())";
  // let params = [req.body.title, req.body.content];
  // conn.query(sql, params, (err, result) => {
  //   if (err) throw err;
  //   console.log('데이터 추가 성공');
  // })
  
  // res.send('데이터 추가 성공');
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})