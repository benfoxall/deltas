var diff = require('diff');
var moment = require('moment');
var express = require('express');
var app = express();

app.get('/feed', function(req, res) {

  const at = nearest(10000, Date.now())
  const body = responseBody(at)
  const etag = at.toString(36)

  res.set('etag', etag)

  if (req.headers['a-im'] == 'x-js-diff' && req.headers['if-none-match']) {
    // attempt to return a diff
    console.log('ATTEMPT IM RESPONSE')

    const lastETag = req.headers['if-none-match']

    if (lastETag === etag) {
      console.log(`304: unchanged from ${etag}`)
      return res.send(304)
    }

    const lastBody = responseBodyForETag(lastETag)

    if(lastBody) {
      console.log(`226: from ${lastETag} to ${etag}`)

      const patch = diff.createTwoFilesPatch('feed', 'feed', lastBody, body, '', '', {context: 0})
      console.log(patch)

      return res.send(226, patch)
    }
  }

  return res.send(responseBody(at))
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('listening at http://%s:%s', host, port);
});


function nearest(to, value) {
  return Math.round(value / to) * to
}

// generate a response (an svg clock would be a cool example)
function responseBody(time) {
  var m = moment(time)

  for (var times = [], i = 0; i < 60; i++) {
    times.push('<li>' + m.format('LTS') + '</li> \n')
    m.subtract(10, 'seconds')
  }

  return '<ul style="font-family:sans-serif">\n' + times.join('') + '</ul>'
}

// This is the part that's challenging.
// We'd need to be able to store/recreate any version of the content
function responseBodyForETag(tag) {
  const time = parseInt(tag, 36)
  return isFinite(time) && responseBody(time)
}
