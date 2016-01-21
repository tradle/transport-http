
var http = require('http')
var test = require('tape')
var Q = require('q')
var collect = require('stream-collector')
var typeforce = require('typeforce')
var ROOT_HASH = require('@tradle/constants').ROOT_HASH
var utils = require('@tradle/utils')
var Transport = require('../')

test('http', function (t) {
  var messenger = new Transport.HttpClient()
  var senderRootHash = 'abc'
  messenger.setRootHash(senderRootHash)

  var msg = new Buffer('blah')
  var received
  var server = http.createServer(function (req, res) {
    collect(req, function (err, bufs) {
      if (err) throw err

      var buf = Buffer.concat(bufs)
      t.deepEqual(buf, msg)
      var resp = new Buffer(JSON.stringify({ hey: 'ho' }))
      res.writeHead(200, {
        'Content-Length': resp.length,
        'Content-Type': 'application/json'
      })

      res.write(resp)
      res.end()
    })

    received = true
  })

  server.listen(function () {
    var recipientRootHash = '123'
    var recipientInfo = {}
    recipientInfo[ROOT_HASH] = recipientRootHash

    messenger.addEndpoint(recipientRootHash, 'http://127.0.0.1:' + server.address().port)
    messenger.send('123', msg, recipientInfo)
      .catch(function (err) {
        console.log(err)
        throw err
      })
      .finally(function () {
        t.ok(received)
      })
      .then(function () {
        server.close()
        return messenger.destroy()
      })
      .done(function () {
        t.end()
      })
  })
})
