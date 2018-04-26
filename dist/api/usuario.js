'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _User = require('models/User');

var _User2 = _interopRequireDefault(_User);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express2.default)();

//Adicionar usuario
function addUser(req, res) {
  var usuario = new _User2.default({
    name: req.body.name,
    password: req.body.password
  });

  usuario.save(function (err) {
    if (err) return res.json({ succes: false, msg: 'User already exits.' });
    res.json({ succes: true, msg: 'Successful created User.' });
  });
}

//autenticar usuario
//findById

function findById(req, res) {
  Pelicula.findById(req.params.id, function (err, resultPelicula) {

    if (err) return res.send(err);
    res.send(resultPelicula);
  });
}

function autenticar(req, res) {
  _User2.default.findOne({ name: req.body.name }, function (err, user) {
    if (err) return res.send(err);
    if (!user) return res.status(403).send({ succes: false, msg: 'Authemtication failed. User not found.' });
    user.comparePassword(req.body.password, function (err, isMath) {
      if (err) return res.send(err);
      var token = jwt.encode(user);
    });
  });
}

router.post('/signup', addUser);

exports.default = router;