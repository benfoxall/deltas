var diff = require('diff');
var Redis = require('ioredis');
var redis = new Redis(process.env.REDISTOGO_URL);
var cons = require('consolidate');
var moment = require('moment');
var express = require('express');
var app = express();

app.engine('html', cons.hogan);

app.set('views', './public');
app.set('view engine', 'html');

app.get('/feed', function(req, res) {

  var m = moment();
  var s = Math.floor(m.seconds() / 10) * 10;
  m.milliseconds(0).seconds(s);

  // 10s since epoch in hex
  var etag = Math.floor(+m / 10000).toString(32);
  res.set('etag', etag); // I don't think this is supposed to work

  for (var times = [], i = 0; i < 60; i++) {
    times.push('<li>' + m.format('LTS') + '</li> \n');
    m.subtract(10, 'seconds');
  }

  var htm = '<ul>\n' + times.join('') + '</ul>';

  //start diff stuff
  redis.setex(etag, 60000, htm);

  if (req.headers['a-im'] == 'x-js-diff' && req.headers['if-none-match']) {
    // attempt to return a diff
    console.log('ATTEMPT IM');

    if (req.headers['if-none-match'] == etag) {
      console.log('same etag, resume');
      res.send(304);
    } else {

      console.log('checking for %s -> %s', req.headers['if-none-match'], etag);
      redis.get(req.headers['if-none-match'])
        .then(function(data) {
          var d = diff.createTwoFilesPatch('feed', 'feed', data, htm, '', '', {context: 1});
          console.log(d);

          // TODO res.send(226, d);
        });

      // for now just send
      res.send(htm);

    }

  } else {
    res.send(htm);
  }
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
