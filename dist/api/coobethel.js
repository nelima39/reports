'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _User = require('models/User');

var _User2 = _interopRequireDefault(_User);

var _utildb = require('utildb');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express2.default)();

router.post('/consulta-saldo', function (req, res) {
  (0, _utildb.getConsultaDeudaProducto)(global.pool, req.body.cedula, function (err, result) {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post('/pago-documento', function (req, res) {
  (0, _utildb.PROCESO_PAGO_DOCUMETO)(global.pool, req.body.prefijo, req.body.terid, req.body.total, req.body.sucursal, req.body.banco, req.body.documento, function (err, result) {

    if (err) return res.status(500).json(err);
    res.json(result);
  });
});
/*
router.post('/consecutivo2',(req,res)=> {
  getCodigoSucursal(global.pool,req.body.prefijo,(err, result)=>{
    if(err) return res.status(500).send(err.toString())
    res.json(result)
  })
})
*/
/**********************************CONCEPTO LIBRE*************************/

/*
router.post('/consulta-saldosinvencer',(req,res)=> {
  getConsultaDeudaSinVencer(global.pool,req.body.cedula,(err, result)=>{
    if(err) return res.json(err)
    res.json(result)
  })
})

*/
router.post('/consulta-concepto', function (req, res) {

  (0, _utildb.getConsultaConcepto)(global.pool, req.body.cedula, function (err, result) {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post('/pago-concepto', function (req, res) {

  (0, _utildb.setPagoxConsultaConcepto)(global.pool, req.body, function (err, result) {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post('/anula-concepto', function (req, res) {

  (0, _utildb.setanulaxConcepto)(global.pool, req.body, function (err, result) {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

exports.default = router;