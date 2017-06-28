importScripts('diff.js')

const CACHE_NAME = 'V-8'

const applyPatch = (prev, patch) => {

  return Promise.all([
    prev.clone().text(),
    patch.clone().text()
  ]).then(([source, patch]) => {
    console.log("applying ", patch)
    return JsDiff.applyPatch(source, patch)
  })
  .then(body => {
    // console.log(prev)
    var headers = new Headers(prev.headers)
    headers.set('etag', patch.headers.get('etag'))

    console.log("headers", Array.from(headers.entries()))

    return new Response(body, {status: 200, headers: headers})
  })

}

self.addEventListener('fetch', function(event) {

  console.log("Requesting (with A-IM)", event.request.url, Date.now())

  const url = event.request.url

  event.respondWith(
    caches.open(CACHE_NAME)
      .then(cache => cache.match(event.request))
      .then(prev => {
        console.log('prev', prev)

        const headers = {
          'A-IM': 'x-js-diff'
        }

        if(prev && prev.headers.has('etag')) {
          headers['if-none-match'] = prev.headers.get('etag')
        }

        return fetch(url, {
          headers: headers
        })
        .then(response => {
          console.log(`handling: ${response.status}`)
          switch (response.status) {
            case 304:
              return prev
            case 226:
              return applyPatch(prev, response)
            default:
              return response
          }
        })
        .then(response => {
          const for_cache = response.clone()

          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, for_cache))

          return response
        })
      })
  );

});
