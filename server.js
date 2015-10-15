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
  body: [{type: String, required: true}],
  author: [{ type: Schema.Types.Mixed, ref: 'User' }],
  date: [Date],
  category: String,
  comments: [{body: String, author: String, date: Date}],
  approved: [{status:Boolean, yes: Number, no: Number, voted: [String]}]
}, {collections: 'articles', strict: false});

var Article = mongoose.model('article', articleSchema);

mongoose.connect(MONGOURI + "/" + dbname);
server.listen(PORT, function () {
  console.log("Server is up on port:", PORT);
})


userSchema.pre('save', function(next) {
    var user = this;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

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

server.use(layouts);

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

server.use('/articles', function (req, res, next) {
  if (req.query.category) {
    res.locals.controller = "category";
  } else {
    res.locals.controller = "articles";
  }
  next();
});

server.use('/articles/new', function (req, res, next) {
  res.locals.controller = "new";
  next();
});

server.use('/login', function (req, res, next) {
  res.locals.controller = "login";
  next();
});

server.use('/session', function (req, res, next) {
  res.locals.controller = "session";
  next();
});

server.use(function (req, res, next) {
  res.locals.controller = res.locals.controller || "default";
  next();
});

server.post('/articles', function (req, res) {

var newArticle = req.body.article;
newArticle.date = Date.now();

User.findOne({username: req.session.currentUser.username}, function (err, currentUser) {
  if (err) {
    console.log(err);
  } else {
    newArticle.author = currentUser.username;
    newArticle.comments = [];
    newArticle.approved = [];
    var approval = {status: true, yes: 0, no: 0, voted: []}
    newArticle.approved[0] = approval;
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
      User.find({}, function (err, users) {
        if (err) {
          console.log("err")
        } else {
          req.session.numUsers = users.length
          res.redirect(302, '/')
        }
      } )
    }
  });
});

server.post('/articles/:id/edit', function (req, res, next) {

  var comment = {
    body: req.body.comment,
    date: Date.now(),
    author: req.session.currentUser.username
  }

  Article.findById(req.params.id, function (err, aSpecificArticle) {
    if (err) {
      console.log("Something not working", err);
    } else {
      aSpecificArticle.comments.push(comment);
      aSpecificArticle.save(function (err) {
        if (err) {
          console.log(err);
        }
      })
      res.redirect(302, '/articles');
    }
  })


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

server.get('/articles/:id/yes', function (req, res, next) {
  Article.findById(req.params.id, function (err, aSpecificArticle) {
    if (err) {
      console.log("Something not working", err);
    } else {
      aSpecificArticle.approved[aSpecificArticle.approved.length-1].yes ++;
      aSpecificArticle.approved[aSpecificArticle.approved.length-1].voted.push(req.session.currentUser.username);
      if (aSpecificArticle.approved[aSpecificArticle.approved.length-1].yes/req.session.numUsers >= .8) {
        aSpecificArticle.approved[aSpecificArticle.approved.length-1].status = true;
      }
      aSpecificArticle.save(function (err) {
        if (err) {
          console.log(err)
        } else {
          res.redirect(302, '/articles')
        }
      })
    }
  })
});

server.get('/articles/:id/no', function (req, res, next) {
  Article.findById(req.params.id, function (err, aSpecificArticle) {
    if (err) {
      console.log("Something not working", err);
    } else {
      aSpecificArticle.approved[aSpecificArticle.approved.length-1].no ++;
      aSpecificArticle.approved[aSpecificArticle.approved.length-1].voted.push(req.session.currentUser.username);

      if (aSpecificArticle.approved[aSpecificArticle.approved.length-1].no/req.session.numUsers >= .2) {
        aSpecificArticle.approved.pop();
        aSpecificArticle.date.pop();
        aSpecificArticle.author.pop();
        aSpecificArticle.body.pop();
      }

      aSpecificArticle.save(function (err) {
        if (err) {
          console.log(err)
        } else {
          res.redirect(302, '/articles')
        }
      })
    }
  })
});

server.patch('/articles/:id', function (req, res) {
  Article.findById(req.params.id, function (err, aSpecificArticle) {
    if (err) {
      console.log("Something not working", err);
    } else {
      aSpecificArticle.title = req.body.article.title;
      aSpecificArticle.body.push(req.body.article.body);
      aSpecificArticle.approved.push({status: false, yes: 0, no: 0, voted: []})
      aSpecificArticle.category = req.body.article.category;
      aSpecificArticle.date.push(Date.now());
      aSpecificArticle.author.push(req.session.currentUser.username);
      aSpecificArticle.save(function (err) {
        if (err) {
          console.log(err);
        }
      })
      res.redirect(302, '/articles');
    }
  })
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
            bcrypt.compare(req.body.user.password, currentUser.password, function (err, match) {
            if (err) {
              console.log(err);
            } else if (!match) {
              req.session.flash.incorrectPassword = "Incorrect Password";
              res.redirect(302, '/login')
            } else {
              req.session.currentUser = req.body.user;
              User.find({}, function (err, users) {
                if (err) {
                  console.log("err")
                } else {
                  req.session.numUsers = users.length
                  res.redirect(302, '/')
                }
              } )
            }
        })
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
