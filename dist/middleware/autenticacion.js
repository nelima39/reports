'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureAuthenticated = ensureAuthenticated;
// middleware.js
var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('./config');

function ensureAuthenticated(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).send({ message: "Tu petición no tiene cabecera de autorización" });
  }

  var token = req.headers.authorization.split(" ")[1];
  var payload = jwt.decode(token, config.TOKEN_SECRET);

  if (payload.exp <= moment().unix()) {
    return res.status(401).send({ message: "El token ha expirado" });
  }

  req.user = payload.sub;
  next();
}