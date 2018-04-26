'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _User = require('models/User');

var _User2 = _interopRequireDefault(_User);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express2.default)();

//Adicionar usuario
function addUser(req, res) {
  var usuario = new Usuario({
    name: req.body.name,
    password: req.body.password
  });

  usuario.save(function (err) {
    if (err) return res.json({ succes: false, msg: 'User already exits.' });
    res.json({ succes: true, msg: 'Successful created User.' });
  });
}

router.post('/signup', addUser);