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

    // mydb = mydb.collection('post').find()
    // .sort({ createdAt: -1 })

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

app.get('/introduction', (req, res) => {
  res.render('introduction.ejs');
})

app.get('/list', (req, res) => {
  let page = parseInt(req.query.page) || 1;

  // 전체 데이터 수를 계산
  mydb.collection('post').countDocuments()
  .then(totalCount => {
    let totalPages = Math.ceil(totalCount / 10);

    // 요청한 페이지의 데이터를 가져옴
    mydb.collection('post').find().sort({ _id: -1 })
      .skip((page - 1) * 10)
      .limit(10)
      .toArray()
      .then(result => {
        res.render('list.ejs', {
          data: result,
          totalPages: totalPages,
          currentPage: page,
          user: req.session.user ? req.session.user : false
        });
      });
  })
  .catch(err => {
    console.error(err);
    res.status(500).send('Server Error');
  });
});

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
  res.redirect('/list?isNew=true');
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
  const newObjectId = new ObjectId();

  mydb
    .collection('post')
    .updateOne({_id: req.body.id}, {$push : { comment : {_id : newObjectId, userid : userid, message : commentMsg} }})
    .then((result) => {
      console.log('완료');
      res.redirect(`/content/${req.body.id}`);
    }).catch((err) => {
      console.log(err);
    })
})

app.post('/deleteComment', (req, res) => {
  console.log(req.body._id);
  postId = new ObjectId(req.body.postId);
  commentId = new ObjectId(req.body._id);
  mydb.collection('post').updateOne(
    {_id : postId}, 
    {$pull : { comment : { _id : commentId} }}
  )
  .then(result => {
    console.log('삭제 완료');
    res.status(200).json({ redirect: '/comment' + postId });
    // res.status(200).send();
  })
  .catch(err => {
    console.log(err);
    res.status(500).send();
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
        res.redirect('/login?fail=true');
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

app.use(express.json());
app.post('/check-id', (req, res) => {
  console.log(req.body);
  const inputId = req.body.id;
  mydb
    .collection('account')
    .findOne({ userid : inputId })
    .then((result) => {
      console.log('result:', result? 0 : 1);
      res.json(result? 0 : 1);
    })

  //   if (user) {
  //     res.json(1);  
  // } else {
  //     res.json(0); 
  // } 

})

app.get('/delete_user', (req, res) => {
  console.log(req.session);
  id = req.session.user.userid;
  req.body = req.session.user;
  mydb
    .collection('account')
    .deleteOne({ userid : id })
    .then((result) => {
      req.session.destroy();
      console.log('삭제 완료');
      return mydb.collection('post').updateMany({author : id}, {$set: {author : '(탈퇴한회원)'}});

    }).then((result) => {
      res.render('index.ejs', { user: null });
    })
    .catch((err) => {
      console.log(err);
    })
})

app.get('/search', (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let itemsPerPage = 10;
  let totalItems = 0;

  // 검색 조건
  let searchQuery = { title: { $regex: req.query.value, $options: 'i' } };

  mydb.collection('post')
    .find(searchQuery)
    .count() // 전체 검색 결과 수 계산
    .then((count) => {
      totalItems = count;
      return mydb.collection('post')
        .find(searchQuery)
        .sort({ _id: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .toArray();
    })
    .then((result) => {
      let totalPages = Math.ceil(totalItems / itemsPerPage);
      res.render('search.ejs', {
        data: result,
        user: req.session.user || null,
        currentPage: page,
        totalPages: totalPages,
        searchValue: req.query.value,
        contentType: 'search' // 콘텐츠 타입 구분
      });
    })
    .catch(err => {
      console.log(err);
    });
});

app.get('/myContent', (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let itemsPerPage = 10;
  let totalItems = 0;

  if (req.session.user) {
    mydb.collection('post')
      .find({ author: req.session.user.userid })
      .count() // 전체 콘텐츠 수 계산
      .then((count) => {
        totalItems = count;
        return mydb.collection('post')
          .find({ author: req.session.user.userid })
          .sort({ _id: -1 })
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .toArray();
      })
      .then((result) => {
        let totalPages = Math.ceil(totalItems / itemsPerPage);
        res.render('search.ejs', {
          data: result,
          user: req.session.user || null,
          currentPage: page,
          totalPages: totalPages,
          searchValue: null, // 검색어 없음
          contentType: 'myContent' // 콘텐츠 타입 구분
        });
      })
      .catch(err => {
        console.log(err);
      });
  } else {
    res.render('search.ejs', { user: null, contentType: 'myContent' });
  }
});

app.get('/', (req, res) => {
  console.log(req.session);
  res.render('index.ejs', {user : req.session.user? req.session.user : null});
})