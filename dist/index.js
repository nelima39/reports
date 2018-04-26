'use strict';

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _methodOverride = require('method-override');

var _methodOverride2 = _interopRequireDefault(_methodOverride);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _nodeFirebird = require('node-firebird');

var _nodeFirebird2 = _interopRequireDefault(_nodeFirebird);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _api = require('api');

var _api2 = _interopRequireDefault(_api);

var _usuario = require('api/usuario');

var _usuario2 = _interopRequireDefault(_usuario);

var _coobethel = require('api/coobethel');

var _coobethel2 = _interopRequireDefault(_coobethel);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _dbfirebird = require('dbfirebird');

var _dbfirebird2 = _interopRequireDefault(_dbfirebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
//import socketio from 'socket.io'
//import redis from 'socket.io-redis'

var server = _http2.default.createServer(app);

var port = process.env.PORT || 3002;
//const database = process.env.MONGOLAB_URI || 'mongodb://appdb:coobethel2017@127.0.0.1:6667/coobethel'
//mongoose.connect(database, onDBConnect)

server.on('listening', onListening);
server.listen(port);
app.use(_bodyParser2.default.urlencoded({ extended: true }));
app.use(_bodyParser2.default.json());
app.use((0, _methodOverride2.default)());
app.use((0, _cors2.default)());
app.use(_passport2.default.initialize());

/*
  app.all('*',(req,res,next)=> {
      logger.info(req.method, req.url)
      next()
  })
  */

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/coobethel', _coobethel2.default);
app.use('/usuarios', _usuario2.default);

/*
function onDBConnect (err, res) {
  if (err) console.log(`ERROR: on connecting to database, ${err}`)
  else {
    global.pool = poolFirebird
    console.log(`Connection established to Database`)
    server.listen(port)
  }
}*/

function onListening() {
  global.pool = _dbfirebird2.default;
  console.log('Connection established to Database');

  console.log('Server listening on http://localhost:' + port);
}