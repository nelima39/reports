'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prueba = prueba;

var _passportJwt = require('passport-jwt');

var _passportJwt2 = _interopRequireDefault(_passportJwt);

var _User = require('models/User');

var _User2 = _interopRequireDefault(_User);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var JwtStrategy = _passportJwt2.default.Strategy;
var ExtractJwt = _passportJwt2.default.ExtractJwt;
function prueba() {
  console.log('ENTRO a test');
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  opts.secretOrKey = _config2.default.TOKEN_SECRET;
  _passport2.default.use(new JwtStrategy(opts, function (jwt_payload, done) {
    console.log(done);
    console.log('ID', jwt_payload.id);
  }));
}