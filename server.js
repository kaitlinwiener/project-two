var express = require ('express'),
    PORT = process.env.PORT || 5432,
    server = express(),
    MONGOURI = process.env.MONGOLAB_URI || "mongodb://localhost:27017",
    dbname = "wiki",
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    ejs = require ('ejs'),
    layouts = require ('express-ejs-layouts'),
    session = require ('express-session'),
    methodOverride = require ('method-override'),
    bodyParser = require ('body-parser'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10;

// MONGOOSE STUFF

var userSchema = new Schema({
  username:  { type: String, required: true, unique: true},
  password: {type: String, required: true}
}, {collections: 'users', strict: false});

var User = mongoose.model('user', userSchema);

var articleSchema = new Schema({
  title:  { type: String, required: true},
  body: {type: String, required: true},
  author: { type: Schema.Types.Mixed, ref: 'User' },
  date: Date,
  category: String
}, {collections: 'articles', strict: false});

var Article = mongoose.model('article', articleSchema);

mongoose.connect(MONGOURI + "/" + dbname);
server.listen(PORT, function () {
  console.log("Server is up on port:", PORT);
})

//APP STUFF

server.set('views', './views');
server.set('view engine', 'ejs');

server.use(morgan('dev'));
server.use(bodyParser.urlencoded({
  extended: true
}));

server.use(session({
  secret: "someFancySecret",
  resave: false,
  saveUninitialized: true
}));

server.use(function (req, res, next) {
  res.locals.flash  = req.session.flash || {};
  req.session.flash = {};
  next();
});

server.use(function (req, res, next) {
 res.locals.currentUser = req.session.currentUser;
 next();
});

server.use(methodOverride('_method'));

server.use(express.static('./public'));



//ROUTES

server.post('/articles', function (req, res) {

var newArticle = req.body.article;
newArticle.date = Date.now();

User.findOne({username: req.session.currentUser.username}, function (err, currentUser) {
  if (err) {
    console.log(err);
  } else {
    newArticle.author = currentUser.username;
    var createdArticle = new Article (newArticle);
    res.locals.username = newArticle.author.username;
    createdArticle.save(function (err, added){
      if (err) {
        console.log("error adding article");
      } else {
        res.redirect(302, '/articles');
      }
    })
  }
});
})

server.get('/login', function (req, res) {
  res.render('login');
})

server.get('/', function (req, res) {
  Article.find({}, function (err, allArticles) {
    if (err) {
      console.log(err);
    } else {
      res.render('home', {
        articles: allArticles
      });
    }
  });
});

server.get('/articles', function (req, res) {
  console.log(req.query.username);
  if (req.query.category) {
    Article.find({category: req.query.category}, function (err, categoryArticles) {
        if (err) {
          console.log(err);
        } else {
          res.render('category', {
            articles: categoryArticles
          })
        }
      })
  } else if (req.query.username) {
    Article.find({author: req.query.username}, function (err, authorArticles) {
        if (err) {
          console.log(err);
        } else {
          res.render('author', {
            articles: authorArticles
          })
        }
      })
  } else {
  Article.find({}, function (err, allArticles) {
    if (err) {
      console.log(err);
    } else {
      res.render('index', {
        articles: allArticles
      });
    }
  });
}

});

server.get('/articles/new', function (req, res) {
  res.render('new');
})


server.post('/users/new', function (req, res) {
  var newUser = new User(req.body.user);
  req.session.currentUser = req.body.user;

  newUser.save(function (err, added) {
    if (err) {
      if (err.code === 11000) {
        req.session.flash.duplicateName = "Username already in use";
        res.redirect(302, '/login');
      } else {
        console.log(err);
      }
    } else {
      res.redirect(302, '/')
    }
  });
});

server.get('/articles/:id/edit', function (req, res, next) {
  Article.findById(req.params.id, function (err, aSpecificArticle) {
    if (err) {
      console.log("Something not working", err);
    } else {
      res.render('edit', {
        article: aSpecificArticle
      });
    }
  })
});

server.patch('/articles/:id', function (req, res) {
  var updatedArticle = req.body;
  updatedArticle.date = Date.now();

  Article.findByIdAndUpdate(req.params.id, updatedArticle, function (err, updatedArticle) {
    if (err) {
      console.log(err);
    } else {
     res.redirect(302, '/articles');
    }
  });
});

server.post('/session', function (req, res) {
  User.findOne({username: req.body.user.username}, function (err, currentUser) {
    if (err) {
      console.log(err);
    } else {
        if (currentUser === null) {
          req.session.flash.userDoesntExist = "Incorrect Username";
          res.redirect(302, '/login')
        }  else {
          if (currentUser.password === req.body.user.password) {
            req.session.currentUser = req.body.user;
            res.redirect(302, '/')
          } else {
            req.session.flash.incorrectPassword = "Incorrect Password";
            res.redirect(302, '/login')
          }
        }
    }
  });
});

server.delete('/session', function (req, res) {
    req.session.currentUser = null;
    res.redirect(302, '/');
})

server.get('/test', function (req, res) {
  res.write("login to my amazing app");
  res.end();
});
