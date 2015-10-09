var express = require ('express'),
    PORT = process.env.PORT || 5432,
    server = express(),
    MONGOURI = process.env.MONGOLAB_URI,
    dbname = "some_userful_name",
    mongoose.require('mongoose');


server.get('/test', function (req, res) {
  res.write("Welcome to my amazing app");
  res.end();
});


mongoose.connect(MONGOURI + "/" + dbname);
server.listen(PORT, function () {
  console.log("Server is up on port:", PORT);
})
