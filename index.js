var cons = require('consolidate');
var moment = require('moment');
var express = require('express');
var app = express();

app.engine('html', cons.hogan);

app.set('views', './public');
app.set('view engine', 'html');

app.get('/', function (req, res) {

  console.log(req.headers);

  var m = moment().startOf('minute');

  // minute since epoch in hex
  var etag = Math.floor(+m / 60000).toString(32);
  res.set('etag', etag); // I don't think this is supposed to work

  for (var times = [], i = 0; i < 60; i++) {
    times.push({
      text: m.format('LTS')
    });
    m.subtract(1, 'minutes');
  }

  res.render('index', { times: times });
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
