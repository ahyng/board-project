const config = require("./config/key.js");
const mongoclient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb')
const url = config.mongoURI
let mydb;
require('dotenv').config();
const session = require('express-session');
const sha = require('sha256');

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

app.use(session({
  secret : process.env.SESSION_SECRET,
  resave : false,
  saveUninitialized : true
}))

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
  res.render('enter.ejs', {user : req.session.user? req.session.user : {userid : '로그인 후 이용하세요'}});
})

app.post('/save', (req, res) => {

  mydb.collection('post').insertOne(
    {title : req.body.title, content: req.body.content, date: req.body.someDate}
  ).then(result => {
    console.log(result);
    console.log('데이터 추가 성공');
    // res.redirect('/list');
  })
  // res.send('데이터 추가 성공');
  res.redirect('/list');
  //mysql
  // let sql = "insert into post (title, content, created) values(?, ?, NOW())";
  // let params = [req.body.title, req.body.content];
  // conn.query(sql, params, (err, result) => {
  //   if (err) throw err;
  //   console.log('데이터 추가 성공');
  // })
  
  // res.send('데이터 추가 성공');
})

app.post('/delete', (req, res) => {
  console.log(req.body._id);
  req.body._id = new ObjectId(req.body._id);
  mydb.collection('post').deleteOne(req.body)
  .then(result => {
    console.log('삭제 완료');
    res.status(200).send();
  })
  .catch(err => {
    console.log(err);
    res.status(500).send();
  })
})

app.get('/content/:id', (req, res) => {
  console.log(req.params.id);
  req.params.id = new ObjectId(req.params.id);
  mydb
    .collection('post')
    .findOne({_id : req.params.id})
    .then((result) => {
      console.log(result);
      res.render('content.ejs', {data : result});
    });
})

app.get('/edit/:id', (req, res) => {
  req.params.id = new ObjectId(req.params.id);
  mydb
    .collection('post')
    .findOne({_id: req.params.id})
    .then((result) => {
      console.log(result);
      res.render('edit.ejs', {data: result});
    })
  
})

app.post('/edit', (req, res) => {
  console.log(req.body);
  req.body.id = new ObjectId(req.body.id);
  mydb
    .collection('post')
    .updateOne({_id: req.body.id}, {$set: {title : req.body.title, content: req.body.content, date: req.body.savedDate}})
    .then((result) => {
      console.log('수정완료');
      res.redirect('/list');
    }).catch((err) => {
      console.log(err);
    })
})

app.get('/login', (req, res) => {
  console.log(req.session);
  if (req.session.user){
    console.log('세션 유지');
    res.render('index.ejs', {user : req.session.user});
  } else {
    res.render('login.ejs');
  }
})

app.post('/login', (req, res) => {
  mydb
    .collection('account')
    .findOne({userid : req.body.userid})
    .then((result) => {
      if (result.userpwd == sha(req.body.userpwd)){
        req.session.user = req.body;
        res.render('index.ejs', {user : req.session.user});

      } else {
        res.render('login.ejs');
      }
    })
})

app.get('/logout', (req, res) => {
  console.log('로그아웃');
  req.session.destroy();
  res.render('index.ejs', {user : null});
})

app.get('/signup', (req, res) => {
  res.render('signup.ejs');
})

app.post('/signup', (req, res) => {
  mydb 
    .collection('account')
    .insertOne({
      userid : req.body.userid,
      userpwd : sha(req.body.userpwd),
      username : req.body.username,
    })
    .then((result) => {
      console.log('회원가입 성공');
    })
    res.redirect('/');
})

app.get('/delete_user', (req, res) => {
  console.log(req.session);
  req.body = req.session.user;
  mydb
    .collection('account')
    .deleteOne(req.bpdy)
    .then((result) => {
      req.session.destroy();
      console.log('삭제 완료');
      res.render('index.ejs', {user : null});
    }).catch((err) => {
      console.log(err);
    })

})

app.get('/', (req, res) => {
  res.render('index.ejs', {user : req.session.user? req.session.user : null});
})