'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _Pelicula = require('models/Pelicula');

var _Pelicula2 = _interopRequireDefault(_Pelicula);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express2.default)();

//findallPeliculas

function findAllPeliculas(req, res) {
  _Pelicula2.default.find(function (err, resultPeliculas) {
    if (err) return res.send(err);
    res.send(resultPeliculas);
  });
}

//findById

function findById(req, res) {
  _Pelicula2.default.findById(req.params.id, function (err, resultPelicula) {

    if (err) return res.send(err);
    res.send(resultPelicula);
  });
}

//Add Pelicula
function addPelicula(req, res) {
  var pelicula = new _Pelicula2.default({
    title: req.body.title,
    year: req.body.year,
    country: req.body.country,
    poster: req.body.poster,
    seasons: req.body.seasons,
    genre: req.body.genre
  });

  pelicula.save(function (err) {
    if (err) return res.send('Erro al guardar la pelicula ' + err);
    res.send('Pelicula Guardada con exito');
  });
}

//Update Pelicula
function updatePelicula(req, res) {
  _Pelicula2.default.findByID(req.params.id, function (err, resultPelicula) {
    resultPelicula.title = req.body.title;
    resultPelicula.year = req.body.year;
    resultPelicula.country = req.body.country;
    resultPelicula.poster = req.body.poster;
    resultPelicula.seasons = req.body.seasons;
    resultPelicula.genre = req.body.genre;
  });

  resultPelicula.save(function (err) {
    if (err) return res.send('Erro al guardar la pelicula ' + err);
    res.send('Pelicula Actualizada con exito');
  });
}

function deleteSerieTv(req, res) {
  _Pelicula2.default.findById(req.params.id, function (err, resultPelicula) {
    resultPelicula.remove(function (err) {
      if (err) return res.send('Erro al eliminar la pelicula ' + err);
      res.send('Pelicula Eliminada con exito');
    });
  });
}

router.get('/listarPeliculas', findAllPeliculas);
router.get('/listarPeliculas/:id', findById);
router.post('/peliculas', addPelicula);
router.put('/listarPeliculas/:id', updatePelicula);
router.delete('/listarPeliculas/:id', deleteSerieTv);
exports.default = router;