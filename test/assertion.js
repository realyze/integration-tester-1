
var integration = require('segmentio-integration');
var support = require('./support');
var express = require('express');
var Assertion = require('..');

describe('Assertion', function(){
  var Segment;
  var segment;
  var server;

  before(function(done){
    var app = express();
    app.use(express.urlencoded());
    app.use(express.json());
    app.all('/text/:action', support.text);
    app.all('/json/:action', support.json);
    server = app.listen(3000, done);
  })

  before(function(){
    Segment = integration('Segment');
    Segment.endpoint('http://localhost:3000/');
    Segment.prototype.identify = support.send;
    Segment.prototype.group = support.send;
    Segment.prototype.screen = support.send;
    Segment.prototype.track = support.send;
    Segment.prototype.alias = support.send;
    Segment.prototype.page = support.send;
    segment = Segment();
  })

  after(function(){
    server.close();
  })

  describe('()', function(){
    it('should throw', function(){
      Assertion.should.throw('expected integration');
    })
  })

  describe('.sends(key, value)', function(){
    it('should assert sent headers correctly', function(done){
      Assertion(segment)
        .identify({})
        .set('key', 'baz')
        .sends('Content-Type', 'application/json')
        .expects(200, done);
    })

    it('should accept regexp as header value', function(done){
      Assertion(segment)
        .identify({})
        .set('key', 'baz')
        .sends('Content-Type', /json/)
        .expects(200, done);
    })

    it('should error if header doesnt match', function(done){
      Assertion(segment)
        .identify({})
        .set('key', 'baz')
        .sends('Content-Type', 'baz')
        .end(error('expected header "Content-Type: application/json" to match "baz"', done));
    })

    it('should error if regexp header doesnt match', function(done){
      Assertion(segment)
        .identify({})
        .set('key', 'baz')
        .sends('Content-Type', /baz/)
        .end(error('expected header "Content-Type: application/json" to match "/baz/"', done));
    })
  })

  describe('.sends(value)', function(done){
    it('should assert sent object body correctly', function(done){
      var date = new Date;
      Assertion(segment)
        .identify({ userId: 1, timestamp: date })
        .set('key', 'baz')
        .sends({ userId: 1, key: 'baz', timestamp: date })
        .expects(200, done);
    })

    it('should assert regexp request correctly', function(done){
      Assertion(segment)
        .set('text', true)
        .set('key', 'baz')
        .group({})
        .sends(/baz/)
        .expects(200, done);
    })
  })

  describe('.expects(value)', function(done){
    it('should assert status correctly', function(done){
      Assertion(segment)
        .identify({})
        .expects(400, done);
    })

    it('should assert object response correctly', function(done){
      Assertion(segment)
        .set('key', 'baz')
        .track({})
        .expects({ success: true })
        .expects(200, done);
    })

    it('should assert string response correctly', function(done){
      Assertion(segment)
        .set('key', 'baz')
        .set('text', true)
        .identify({})
        .expects('success=true', done);
    })

    it('should assert regexp response correctly', function(done){
      Assertion(segment)
        .set('key', 'baz')
        .set('text', true)
        .identify({})
        .expects(/success/, done);
    })

    it('should error if object doesnt match response', function(done){
      Assertion(segment)
        .set('key', 'baz')
        .alias({})
        .expects({ 0: 0 })
        .end(error('expected "{ \'0\': 0 }" but got "{ success: true }"', done));
    })

    it('should error if status doesnt match', function(done){
      Assertion(segment)
        .set('key', 'baz')
        .identify({})
        .expects(500)
        .end(error('expected "500" but got "200"', done));
    })

    it('should error if string doesnt match response', function(done){
      Assertion(segment)
        .set('key', 'baz')
        .set('text', true)
        .identify({})
        .expects('weee')
        .end(error('expected "weee" but got "success=true"', done));
    })

    it('should error if regexp doesnt match response', function(done){
      Assertion(segment)
        .set('key', 'baz')
        .set('text', true)
        .identify({})
        .expects(/wee/)
        .end(error('expected "success=true" to match "/wee/"', done));
    })
  })
})

/**
 * Expect an error
 */

function error(msg, done){
  return function(err, res){
    if (!err) return done(new Error('expected an error'));
    err.message.should.eql(msg);
    done();
  };
}