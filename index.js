var moment = require('moment');
var express = require('express');
var app = express();

app.get('/', function (req, res) {

  var m = moment().startOf('minute');

  // minute since epoch in hex
  var etag = Math.floor(+m / 60000).toString(32);
  res.set('etag', etag); // I don't think this is supposed to work

  for(var times = [], i = 0; i < 60; i++){
    times.push(m.format('LTS'));
    m.subtract(1, 'minutes');
  }

  // yup
  res.send('<ul>\n' +
    times.map(function(t){
      return '\t<li>' + t + '</li>\n';
    }).join('') +
  '</ul>\n');
});

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
