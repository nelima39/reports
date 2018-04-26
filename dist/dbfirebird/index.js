'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeFirebird = require('node-firebird');

var _nodeFirebird2 = _interopRequireDefault(_nodeFirebird);

var _conexiones = require('conexiones');

var _conexiones2 = _interopRequireDefault(_conexiones);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _nodeFirebird2.default.pool(5, _conexiones2.default);