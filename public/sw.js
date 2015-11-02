console.log('hello from SW');

self.addEventListener('fetch', function(event) {

  event.respondWith(
    fetch(event.request.url, {
      headers: {
        'A-IM': 'x-js-diff'
        // todo - add etag
      }
    })
  );

});
