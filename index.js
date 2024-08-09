const config = require("./config/key.js");
const mongoclient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb')
const url = config.mongoURI
let mydb;
require('dotenv').config();
const session = require('express-session');
const sha = require('sha256');



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
const port = 8080;
const bodyParser = require('body-parser');
// const db = require('node-mysql/lib/db');
// const { mongo } = require('mongoose');
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

mongoclient.connect(url)
  .then(client => {
    mydb = client.db('board');
    // mydb.collection('post').find().toArray().then(result => {
    //   console.log(result);
    // })

    app.listen(port, () => {
      console.log('port 8080...');
    });
  }).catch(err => {
    console.log(err);
  })

// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`);
//   })

app.use(session({
  secret : process.env.SESSION_SECRET,
  resave : false,
  saveUninitialized : true,
  cookie : { maxAge : 60 * 60 * 12 * 1000 },
  rolling : true
}))

app.get('/list', (req, res) => {
  // conn.query("select * from post", function(err, rows, fields){
  //   if (err) throw err;
  //   res.render('list.ejs', {data : rows});
  // })

  mydb.collection('post').find().toArray().then(result => {
    // console.log(result);
    res.render('list.ejs', {data : result, user : req.session.user? req.session.user : false});
  })

})

app.get('/enter', (req, res) => {
  res.render('enter.ejs', {user : req.session.user? req.session.user : false});
})

app.post('/save', (req, res) => {

  mydb.collection('post').insertOne(
    {title : req.body.title, content: req.body.content, author: req.body.author, date: req.body.someDate}
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
    // res.status(200).json({ redirect: '/list' });
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
      res.render('content.ejs', {data : result, user : req.session.user || null});
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

app.post('/comment', (req, res) => {
  console.log(req.body);

  let userid = req.body.userid;
  let commentMsg = req.body.commentMessage;
  req.body.id = new ObjectId(req.body.postId);
  
  mydb
    .collection('post')
    .updateOne({_id: req.body.id}, {$push : { comment : {id : userid, message : commentMsg} }})
    .then((result) => {
      console.log('완료');
      res.redirect(`/content/${req.body.id}`);
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
      if (result && result.userpwd == sha(req.body.userpwd)){
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
      useremail : req.body.useremail,
    })
    .then((result) => {
      console.log('회원가입 성공');
    })
    res.redirect('/');
})

app.post('/check-id', async (req, res) => {
  console.log(req.body);
  const inputId = req.body.inputId;
  const user = await mydb.collection('account').findOne({ id: inputId });

    if (user) {
      res.json(1);  
  } else {
      res.json(0); 
  } 

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

app.get('/search', (req, res) => {
  console.log(req.query);
  mydb
    .collection('post')
    .find({title : { $regex: req.query.value, $options: 'i' } }).toArray()
    .then((result) => {
      console.log(result);
      res.render('search.ejs', {data : result, user: req.session.user || false});

      console.log('완료');
    }).catch(err => {
      console.log(err);
    })
})

app.get('/myContent', (req, res) => {
  console.log(req.session.user);
  if (req.session.user) {
    mydb
    .collection('post')
    .find({author : req.session.user.userid}).toArray()
    .then((result) => {
      res.render('search.ejs', {data : result, user: req.session.user || null});
      console.log('완료');
    }).catch(err => {
      console.log(err);
    })
  } else {
    res.render('search.ejs', {user: null});
  }
})

app.get('/', (req, res) => {
  console.log(req.session);
  res.render('index.ejs', {user : req.session.user? req.session.user : null});
})