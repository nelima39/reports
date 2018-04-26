'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConsultaDeudaProducto = getConsultaDeudaProducto;
exports.PROCESO_PAGO_DOCUMETO = PROCESO_PAGO_DOCUMETO;
exports.getConsultaConcepto = getConsultaConcepto;
exports.setPagoxConsultaConcepto = setPagoxConsultaConcepto;
exports.setanulaxConcepto = setanulaxConcepto;

var _nodeFirebird = require('node-firebird');

var _nodeFirebird2 = _interopRequireDefault(_nodeFirebird);

var _lpad = require('underscore.string/lpad');

var _lpad2 = _interopRequireDefault(_lpad);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _msnerror = require('msnerror');

var _msnerror2 = _interopRequireDefault(_msnerror);

var _conceptos = require('utildb/conceptos');

var _conceptos2 = _interopRequireDefault(_conceptos);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function responseOK(mensaje, idtx) {

  var mensajeOK = {};
  mensajeOK.idtx = idtx, mensajeOK.statustx = "OK", mensajeOK.fecha = (0, _moment2.default)(new Date()).format("MMM DD, YYYY HH:MM:SS A"), mensajeOK.msg = mensaje;

  return mensajeOK;
}

function responseError(mensaje, idtx) {

  var mensajeError = {};
  mensajeError.idtx = idtx, mensajeError.statustx = "ERROR", mensajeError.fecha = (0, _moment2.default)(new Date()).format("MMM DD, YYYY HH:MM:SS A"), mensajeError.msg = mensaje;

  return mensajeError;
}

function isUserTNS(poolDB, cedula, callback) {

  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = 'SELECT TERID,EXTRACT(MONTH FROM  CURRENT_TIMESTAMP),CAST(nombre  AS VARCHAR(120) CHARACTER SET iso8859_1) as nombre FROM TERCEROS WHERE NITTRI=?';

    connection.query(sql, [cedula], function (err, result) {

      if (err) {
        connection.detach();
        return callback(err, null);
      }
      if (result.length <= 0) {
        connection.detach();
        return callback('Usuario No existe', null);
      }
      callback(null, result);
      connection.detach();
    });
  });
}

function isUserTNSByTerid(poolDB, terid, callback) {

  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = 'SELECT TERID FROM TERCEROS WHERE TERID=?';

    connection.query(sql, [terid], function (err, result) {

      if (err) {
        connection.detach();
        return callback(err, null);
      }
      if (result.length <= 0) {
        connection.detach();
        return callback('Usuario No existe', null);
      }
      callback(null, result);
      connection.detach();
    });
  });
}

function isUserDocumentosTNS(poolDB, cedula, callback) {
  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = ' Select CAST( d.codcomp||d.codprefijo||d.numero AS VARCHAR(12) CHARACTER SET iso8859_1) doc' + ' from docufin d inner join terceros t on (d.terid=t.terid)' + ' where t.nittri=? AND d.fecasent is not null';
    connection.query(sql, [cedula], function (err, result) {
      if (err) {
        connection.detach();
        return callback(err, null);
      }
      callback(null, result);
      connection.detach();
    });
  });
}

function proximaCuotaVencer(poolDB, cedula, callback) {

  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = ' SELECT t.terid,CAST(t.nombre AS VARCHAR(120) CHARACTER SET iso8859_1) as nombre,' + ' CAST( d.codcomp||d.codprefijo||d.numero  AS VARCHAR(12) CHARACTER SET iso8859_1) as DOCUMENTO,' + ' CAST(l.descrip AS VARCHAR(40) CHARACTER SET iso8859_1) AS LINEA,' + ' SUM(dd.salcap) salcap,' + ' SUM(dd.salint) salint,' + ' SUM(dd.saldto1) dto1,' + ' SUM(dd.saldto2) seguro,' + ' 0 mora,' + ' SUM(CEIL(dd.salcap+dd.salint+dd.saldto1+dd.saldto2)) total' + ' FROM docufin d' + ' INNER JOIN ddocucu dd ON (d.docufinid = dd.docufinid)' + ' INNER JOIN terceros t ON (d.terid=t.terid)' + ' INNER JOIN lineacre l on (d.lineacreid=l.lineacreid)' + ' WHERE t.nittri= ?' + ' AND d.fecasent IS NOT NULL AND dd.fecvence > CURRENT_TIMESTAMP' + ' AND (dd.salcap> 0 OR dd.salint>0 OR saldto2>0)' + ' GROUP BY 1,2,3,4' + ' ORDER BY 4,1';
    connection.query(sql, [cedula], function (err, result) {
      if (err) {
        connection.detach();
        return callback(err, null);
      }
      if (result.length <= 0) {
        connection.detach();
        return callback('En el Momento no tiene deudas pendientes.', null);
      }
      callback(null, result);
      connection.detach();
    });
  });
}

function cuotasVencidas(poolDB, cedula, callback) {

  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = 'SELECT tt.terid,CAST(tt.nombre AS VARCHAR(120) CHARACTER SET iso8859_1) as nombre,CAST(tt.DOCUMENTO AS VARCHAR(12) CHARACTER SET iso8859_1) as DOCUMENTO, ' + ' CAST( tt.LINEA AS VARCHAR(40) CHARACTER SET iso8859_1) AS linea, ' + ' SUM(tt.DESCUENTO) DESCUENTO,' + ' SUM(tt.seguro) seguro,' + ' SUM(tt.MORA) MORA,' + ' SUM(tt.TOTAL) TOTAL' + '   FROM (select DD.DDOCUCUID,D.DOCUFINID,t.terid,CAST(t.nombre  AS VARCHAR(120) CHARACTER SET iso8859_1) as nombre,' + '   CAST( d.codcomp||d.codprefijo||d.numero  AS VARCHAR(12) CHARACTER SET iso8859_1) as DOCUMENTO,' + '   CAST(l.descrip AS VARCHAR(40) CHARACTER SET iso8859_1) AS linea,t.nittri, ' + '   SUM(dd.salcap) CAPITAL,' + '   SUM(dd.salint) INTERES,' + '   SUM(dd.saldto1) DESCUENTO,' + '   SUM(dd.saldto2) seguro,' + '   IIF(' + '   sum (ceil (((dd.salcap*(d.intmor/100))/30)*(datediff(day,dd.fecvence,CURRENT_TIMESTAMP))))-' + '   (SELECT coalesce(SUM (DR1.ABMOR),0)' + '   FROM RECFI R1 INNER JOIN DRECFI DR1 ON (R1.RECFID=DR1.RECFID)' + '   WHERE DR1.DDOCUCUID=DD.DDOCUCUID AND R1.FECASENT IS NOT NULL)>0,' + '   sum (ceil (((dd.salcap*(d.intmor/100))/30)*(datediff(day,dd.fecvence,CURRENT_TIMESTAMP))))-' + '   (SELECT coalesce(SUM (DR1.ABMOR),0)' + '   FROM RECFI R1 INNER JOIN DRECFI DR1 ON (R1.RECFID=DR1.RECFID)' + '   WHERE DR1.DDOCUCUID=DD.DDOCUCUID AND R1.FECASENT IS NOT NULL),0) mora,' + '   sum(ceil(dd.salcap+dd.salint+dd.saldto1+dd.saldto2))+' + '   IIF (' + '   sum (ceil (((dd.salcap*(d.intmor/100))/30)*(datediff(day,dd.fecvence,CURRENT_TIMESTAMP))))-' + '   (SELECT coalesce(SUM (DR1.ABMOR),0)' + '   FROM RECFI R1 INNER JOIN DRECFI DR1 ON (R1.RECFID=DR1.RECFID)' + '   WHERE DR1.DDOCUCUID=DD.DDOCUCUID AND R1.FECASENT IS NOT NULL)>0,' + '   sum (ceil (((dd.salcap*(d.intmor/100))/30)*(datediff(day,dd.fecvence,CURRENT_TIMESTAMP))))-' + '   (SELECT coalesce(SUM (DR1.ABMOR),0)' + '   FROM RECFI R1 INNER JOIN DRECFI DR1 ON (R1.RECFID=DR1.RECFID)' + '   WHERE DR1.DDOCUCUID=DD.DDOCUCUID AND R1.FECASENT IS NOT NULL),0) total' + '   from docufin d inner join ddocucu dd on (d.docufinid=dd.docufinid)' + '   inner join terceros t on (d.terid=t.terid)' + '   inner join lineacre l on (d.lineacreid=l.lineacreid)' + '   where d.fecasent is not null ' + ' and (dd.salcap> 0 or dd.salint>0 or saldto2>0) AND dd.fecvence <= CURRENT_TIMESTAMP' + ' group by 1,2,3,4,5,6,7' + ' )AS tt' + ' WHERE tt.nittri=?' + ' group by 1,2,3,4';

    connection.query(sql, [cedula], function (err, result) {
      if (err) {
        connection.detach();
        return callback(err, null);
      }

      callback(null, result);
      connection.detach();
    });
  });
}

function getConsultaDeudaProducto(poolDB, cedula, callback) {
  isUserTNS(poolDB, cedula, function (err, uservalida) {

    if (err) return callback(responseError(err, 1), null);

    if (uservalida[0]) {
      isUserDocumentosTNS(poolDB, cedula, function (err, documento) {
        if (err) return callback(responseError(err, 1), null);

        if (documento[0]) {
          cuotasVencidas(poolDB, cedula, function (err, totalVencidas) {

            if (err) return callback(responseError(err, 1), null);

            if (!totalVencidas[0]) {
              proximaCuotaVencer(poolDB, cedula, function (err, proximaCuotaVencer) {

                if (err) return callback(responseError(err, 1), null);
                callback(null, responseOK(proximaCuotaVencer, 1));
              });
            } else {
              callback(null, responseOK(totalVencidas, 1));
            }
          });
        } else {
          callback(responseError(_msnerror2.default.errmsn2, 1), null);
        }
      });
    } else {
      callback(responseError(_msnerror2.default.errmsn1, 1), null);
    }
  });
}

/*PROCESO DE INSERCION------------------------------------------------*/

/*
  function generarId(poolDB,callback){
    poolDB.get(function(err, connection) {
        if(err) return callback(err,null)
        var sql ='SELECT gen_id(RECFID_gen, 1) FROM RDB$DATABASE'
          connection.query(sql,{},
          function(err, id) {
            if(err) return callback(err,null)
            callback(null,id)
            connection.detach();
        })
     })
  }

*/

//paso I : GENERAMOS CONSECUTIVO
function getConsecutivo(poolDB, prefijo, callback) {

  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = 'SELECT MAX(CAST(lpad(CONSECUTIVO,CHAR_LENGTH(CONSECUTIVO),0) AS VARCHAR(8) CHARACTER SET iso8859_1)) FROM CONSECUTIVO WHERE codcomp=? AND codprefijo=?';
    connection.query(sql, ['RC', prefijo.toUpperCase()], function (err, result) {
      if (err) {
        return callback(err, null);
        connection.detach();
      }

      console.log('ZZZ>>', result);

      if (result[0].MAX <= 0) {
        connection.detach();
        return callback('PREFIJO NO ENCONTRADO.', null);
      }

      callback(null, result[0].MAX);
      connection.detach();
    });
  });
}
//Paso II - COSULTAMOS EL CODIGO DE LA SUCURSAL
function getCodigoSucursal(poolDB, sucursal, callback) {

  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = ' SELECT SUCID FROM SUCURSAL WHERE CODSUC=?';
    connection.query(sql, [sucursal], function (err, result) {
      if (err) {
        connection.detach();
        return callback(err, null);
      }
      if (result.length <= 0) {
        connection.detach();
        return callback('SUCURSAL [' + sucursal + '] NO VALIDO.', null);
      }
      callback(null, result[0].SUCID);
      connection.detach();
    });
  });
}

//Paso III - CONSULTA EL BANCO QUE LE CORRESPONDE A LA EMPRESA
function consultaBanco(poolDB, codigoBanco, callback) {
  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = 'select bcoid from banco where codigo=?';
    connection.query(sql, [codigoBanco], function (err, banco) {
      if (err) {
        connection.detach();
        return callback(err, null);
      }

      if (banco.length <= 0) {
        connection.detach();
        return callback('BANCO [' + codigoBanco + '] NO VALIDO.', null);
      }
      callback(null, banco[0].BCOID);
      connection.detach();
    });
  });
}

function consultaCuentaBanco(poolDB, bancoid, callback) {
  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = 'select pucid from banco where bcoid=?';
    connection.query(sql, [bancoid], function (err, result) {
      if (err) {
        connection.detach();
        return callback(err, null);
      }

      if (result.length <= 0) {
        connection.detach();
        return callback('CUENTA BANCO [' + bancoid + '] NO VALIDO.', null);
      }
      callback(null, result[0].PUCID);
      connection.detach();
    });
  });
}

//Paso IV- INSERTAMOS EL ENCABEZADO
function insertEncabezado(poolDB, transaction, data, callback) {
  var CODPREFIJO = data.CODPREFIJO,
      NUMERO = data.NUMERO,
      TERID = data.TERID,
      SUCID = data.SUCID,
      DETALLE = data.DETALLE,
      TOTAL = data.TOTAL;

  var fecha = (0, _moment2.default)(new Date()).format("MM/DD/YYYY");
  var mes = (0, _moment2.default)(new Date()).format("MM");

  var sql = 'INSERT INTO RECFI(CODPREFIJO,NUMERO,FECHA,TERID,SUCID,PERIODO,CENID,DETALLE,TOTAL,FECHACORTE,AREADID,FECASENT)  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
  transaction.query(sql, [CODPREFIJO, NUMERO, fecha, TERID, SUCID, mes, 1, DETALLE, TOTAL, fecha, 1, fecha], // bind value for :id
  function (err, result) {
    if (err) return callback(err, null);
    callback(null, result);
  });
}

//Paso V- CONSULTA RECFID DESPUES DE INSERTAR EL ENCABEZADO
function getRecfID(transaction, numero, prefijo, callback) {

  var sql = 'SELECT RECFID FROM RECFI WHERE numero=? AND codprefijo=?';
  transaction.query(sql, [numero, prefijo], function (err, id) {

    if (err) return callback(err, null);

    callback(null, id);
  });
}

//Paso VI- CONSULTAR SALDOS A PAGAR
function getConsultaSaldos(poolDB, terid, documento, callback) {
  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    /*  var sql ="select SUBSTRING(100 + EXTRACT(MONTH FROM DD.fecvence) FROM 2 FOR 2) || '/' ||" +
     " SUBSTRING(100 + EXTRACT(DAY FROM DD.fecvence) FROM 2 FOR 2) || '/' ||" +
     " EXTRACT(YEAR FROM DD.fecvence) */

    var sql = "select SUBSTRING(100 + EXTRACT(DAY FROM DD.fecvence) FROM 2 FOR 2) || '/' ||" + " SUBSTRING(100 + EXTRACT(MONTH FROM DD.fecvence) FROM 2 FOR 2) || '/' ||" + " EXTRACT(YEAR FROM DD.fecvence) FECVENCE," + " DD.DDOCUCUID, " + " t.terid,D.DOCUFINID," + " CAST( d.codcomp  AS VARCHAR(12) CHARACTER SET iso8859_1) as doc_tipo," + " CAST( d.codprefijo||d.numero  AS VARCHAR(12) CHARACTER SET iso8859_1) as doc_numero," + " CAST( d.codcomp||d.codprefijo||d.numero  AS VARCHAR(12) CHARACTER SET iso8859_1) as doc," + " CAST(l.descrip AS VARCHAR(40) CHARACTER SET iso8859_1) AS linea," + " IIF( sum (ceil (((dd.salcap*(d.intmor/100))/30)*(datediff(day,dd.fecvence,CURRENT_TIMESTAMP))))-" + " (SELECT coalesce(SUM (DR1.ABMOR),0) " + " FROM RECFI R1 INNER JOIN DRECFI DR1 ON (R1.RECFID=DR1.RECFID) " + " WHERE DR1.DDOCUCUID=DD.DDOCUCUID AND R1.FECASENT IS NOT NULL)>0," + " sum (ceil (((dd.salcap*(d.intmor/100))/30)*(datediff(day,dd.fecvence,CURRENT_TIMESTAMP))))-" + " (SELECT coalesce(SUM (DR1.ABMOR),0) " + " FROM RECFI R1 INNER JOIN DRECFI DR1 ON (R1.RECFID=DR1.RECFID) " + " WHERE DR1.DDOCUCUID=DD.DDOCUCUID AND R1.FECASENT IS NOT NULL),0) mora," + "  dd.salint," + " dd.saldto2 seguro," + " dd.salcap," + " sum(ceil(dd.salcap+dd.salint+dd.saldto1+dd.saldto2))+ " + " IIF( sum (ceil (((dd.salcap*(d.intmor/100))/30)*(datediff(day,dd.fecvence,CURRENT_TIMESTAMP))))-" + " (SELECT coalesce(SUM (DR1.ABMOR),0) " + " FROM RECFI R1 INNER JOIN DRECFI DR1 ON (R1.RECFID=DR1.RECFID) " + " WHERE DR1.DDOCUCUID=DD.DDOCUCUID AND R1.FECASENT IS NOT NULL)>0," + " sum (ceil (((dd.salcap*(d.intmor/100))/30)*(datediff(day,dd.fecvence,CURRENT_TIMESTAMP))))-" + " (SELECT coalesce(SUM (DR1.ABMOR),0) " + " FROM RECFI R1 INNER JOIN DRECFI DR1 ON (R1.RECFID=DR1.RECFID) " + " WHERE DR1.DDOCUCUID=DD.DDOCUCUID AND R1.FECASENT IS NOT NULL),0) total," + " d.saldo,d.califiact,l.lineacreid,dd.nrocuota" + " from docufin d inner join ddocucu dd on (d.docufinid=dd.docufinid)" + " inner join terceros t on (d.terid=t.terid)" + " inner join lineacre l on (d.lineacreid=l.lineacreid)" + " where d.fecasent is not null and t.terid=?" + " and d.codcomp||d.codprefijo||d.numero=?" + " and (dd.salcap> 0 or dd.salint>0 or saldto2>0)" + " group by 1,2,3,4,5,6,7,8,10,11,12,d.saldo,d.califiact,l.lineacreid,dd.nrocuota" + " ORDER BY 3||2||1";

    connection.query(sql, [terid, documento], function (err, id) {

      if (err) {
        connection.detach();
        return callback(err, null);
      }

      callback(null, id);
      connection.detach();
    });
  });
}

//Paso VII- INSERTO EN EL DERECFI

function insertDRECFI(transaction, data, docpago, moviid, cuentas, terid, listaSaldos, callback) {

  var sql = 'INSERT INTO DRECFI (RECFID,DDOCUCUID,ABCAP,ABINT,ABMOR,ABDCTO1,ABDCTO2,INTNOGEN,DTO1NOGEN,DTO2NOGEN,ABEXCEDE,ABFALTANTE,' + ' ABCAPNIIF,ABINTNIIF,ABDTONIIF1,ABDTONIIF2,DTONIIF1NOGEN,DTONIIF2NOGEN)' + ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  transaction.query(sql, [data.recfid, data.pago.DDOCUCUID, data.pago.SALCAP, data.pago.SALINT, data.pago.MORA, 0, data.pago.SEGURO, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // bind value for :id
  function (err, result) {
    if (err) {
      transaction.rollback();
      callback(err, null);
    }
    updateDDocucu(transaction, data, docpago, function (err, result) {
      if (err) {
        transaction.rollback();
        callback(err, null);
      }

      var ctamor = cuentas[0].CTAMOR;
      var ctadetdes2 = cuentas[0].CTADETDES2;
      var ctacapital = cuentas[0].CTACAPITAL;
      var ctainteres = cuentas[0].CTAINTERES;
      var fecha = (0, _moment2.default)(new Date()).format("MM/DD/YYYY");
      var numeroCuota = listaSaldos[0].NROCUOTA;
      var fechavencimiento = (0, _moment2.default)(new Date(listaSaldos[0].FECVENCE)).format("MM/DD/YYYY");
      var dataContabilidad = {};

      dataContabilidad.moviid = moviid[0].MOVID;
      dataContabilidad.valortraniif = 0;
      dataContabilidad.tipocd = 'C';
      dataContabilidad.terid = terid;
      dataContabilidad.tipdocum = listaSaldos[0].DOC_TIPO;
      dataContabilidad.nrodocum = listaSaldos[0].DOC_NUMERO;
      dataContabilidad.baseret = 0;
      dataContabilidad.cenid = 1;
      dataContabilidad.fuenterecid = 1;

      if (data.pago.SALCAP > 0) {
        dataContabilidad.valortra = data.pago.SALCAP;
        dataContabilidad.pucid = ctacapital;
        dataContabilidad.obstra = 'Pago a Capital Cuota N. ' + numeroCuota + ' con fecha venc. ' + data.pago.FECVENCE;
        if (ctacapital > 0) {
          insertDEMOVI(transaction, dataContabilidad, function (err, result) {
            if (err) {
              transaction.rollback();
              callback(err, null);
            }

            //console.log('TEST DE LA CONTABILIDAD-->',dataContabilidad)
          });
        } else {
          transaction.rollback();
          callback('DEBE CONFIGURAR LA CUENTA CONTABLE DE CAPITAL PARA EL DOCUMENTO ' + listaSaldos[0].DOC, null);
        }
      }

      if (data.pago.SALINT > 0) {
        dataContabilidad.valortra = data.pago.SALINT;
        dataContabilidad.pucid = ctainteres;
        dataContabilidad.obstra = 'Pago a Interes. Cuota N. ' + numeroCuota + ' con fecha venc. ' + data.pago.FECVENCE;
        if (ctainteres > 0) {
          insertDEMOVI(transaction, dataContabilidad, function (err, result) {
            if (err) {
              transaction.rollback();
              callback(err, null);
            }

            //console.log('TEST DE LA CONTABILIDAD-->',dataContabilidad)
          });
        } else {
          transaction.rollback();
          callback('DEBE CONFIGURAR LA CUENTA CONTABLE DE INTERES PARA EL DOCUMENTO ' + listaSaldos[0].DOC, null);
        }
      }

      if (data.pago.MORA > 0) {
        dataContabilidad.valortra = data.pago.MORA;
        dataContabilidad.pucid = ctamor;
        dataContabilidad.obstra = 'Pago a Mora. Cuota N. ' + numeroCuota + ' con fecha venc. ' + data.pago.FECVENCE;
        if (ctamor > 0) {
          insertDEMOVI(transaction, dataContabilidad, function (err, result) {
            if (err) {
              transaction.rollback();
              callback(err, null);
            }

            //console.log('TEST DE LA CONTABILIDAD-->',dataContabilidad)
          });
        } else {
          transaction.rollback();
          callback('DEBE CONFIGURAR LA CUENTA CONTABLE DE MORA PARA EL DOCUMENTO ' + listaSaldos[0].DOC, null);
        }
      }

      if (data.pago.SEGURO > 0) {
        dataContabilidad.valortra = data.pago.SEGURO;
        dataContabilidad.pucid = ctadetdes2;
        dataContabilidad.obstra = 'Pago a Seguro. Cuota N. ' + numeroCuota + ' con fecha venc. ' + data.pago.FECVENCE;
        if (ctadetdes2 > 0) {
          insertDEMOVI(transaction, dataContabilidad, function (err, result) {
            if (err) {
              transaction.rollback();
              callback(err, null);
            }
            callback(null, 'OK');
            //console.log('TEST DE LA CONTABILIDAD-->',dataContabilidad)
          });
        } else {
          transaction.rollback();
          callback('DEBE CONFIGURAR LA CUENTA CONTABLE DE SEGURO PARA EL DOCUMENTO ' + listaSaldos[0].DOC, null);
        }
      } else callback(null, 'OK');
    });
  });
}

function updateDDocucu(transaction, data, docpago, callback) {

  var fecha = (0, _moment2.default)(new Date()).format("MM/DD/YYYY");
  var sql = ' UPDATE DDOCUCU SET SALCAP=?,SALINT=?,SALDTO1=?,SALDTO2=?,FECULPAGO=?,DOCULPAGO=?' + ' WHERE DDOCUCUID=?';
  transaction.query(sql, [data.pendientecapital, data.pendienteinteres, 0, data.pendienteseguro, fecha, docpago, data.pago.DDOCUCUID], // bind value for :id
  function (err, result) {

    if (err) {
      transaction.rollback();
      callback(err, null);
    }
    callback(null, 'OK');
  });
}

function updateDocufin(transaction, docufinid, saldo, callback) {
  var fecha = (0, _moment2.default)(new Date()).format("MM/DD/YYYY");
  var sql = 'update docufin set saldo=? where docufinid=?';
  transaction.query(sql, [saldo, docufinid], // bind value for :id
  function (err, result) {
    if (err) {
      transaction.rollback();
      callback(err, null);
    }
    callback(null, 'OK');
  });
}

function insertDRECFIFP(transaction, RECFID, VALOR, BCOID, callback) {
  var fecha = (0, _moment2.default)(new Date()).format("MM/DD/YYYY");
  var sql = 'INSERT INTO DRECFIFP(RECFID,VALOR,BCOID,FORMAPAGO) values(?,?,?,?)';
  transaction.query(sql, [RECFID, VALOR, BCOID, 'EF'], // bind value for :id
  function (err, result) {
    if (err) {
      transaction.rollback();
      callback(err, null);
    }
    callback(null, 'OK');
  });
}

//PROCESO DE CONTABILIDAD

function insertMOVI(transaction, data, callback) {
  var fecha = (0, _moment2.default)(new Date()).format("MM/DD/YYYY");
  var periodo = (0, _moment2.default)(new Date()).format("MM");
  var sql = ' INSERT INTO MOVI (CODCOMP,CODPREFIJO,NUMERO,OBS,FECHA,TOTDB,TOTCR,FECASENT,PERIODO,AREADID,SUCID,IMPORTADO,USUARIO,' + ' TOTDBNIIF,TOTCRNIIF) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  transaction.query(sql, ['RC', data.prefijo, data.numero, data.obs, fecha, data.totdb, data.totcr, fecha, periodo, 1, data.sucursal, 'S', 'WS', 0, 0], // bind value for :id
  function (err, result) {
    if (err) {
      transaction.rollback();
      callback(err, null);
    }
    callback(null, 'OK');
  });
}

function insertDEMOVI(transaction, data, callback) {
  //var fecha = moment(new Date()).format("MM/DD/YYYY")
  //var periodo = moment(new Date()).format("MM")

  var sql = ' INSERT INTO DEMOVI (MOVID,PUCID,VALORTRA,VALORTRANIIF,TIPOCD,TERID,OBSTRA,TIPDOCUM,NRODOCUM,BASERET,CENID,FUENTERECID)' + ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';

  transaction.query(sql, [data.moviid, data.pucid, data.valortra, data.valortraniif, data.tipocd, data.terid, data.obstra, data.tipdocum, data.nrodocum, data.baseret, data.cenid, data.fuenterecid], // bind value for :id
  function (err, result) {
    if (err) {
      transaction.rollback();
      callback(err, null);
    }
    callback(null, 'OK');
  });
}

function getMOVIID(transaction, codprefijo, numero, callback) {
  var sql = 'SELECT MOVID FROM MOVI WHERE CODCOMP=? AND CODPREFIJO=? AND NUMERO=?';
  transaction.query(sql, ['RC', codprefijo, numero], // bind value for :id
  function (err, result) {
    if (err) {
      transaction.rollback();
      callback(err, null);
    }
    callback(null, result);
  });
}

function getCuentasContables(transaction, docufinid, lineacredito, callback) {

  var sql = " SELECT COALESCE (cre.CTAMOR,0) AS CTAMOR,COALESCE (cre.CTADETDES2,0) AS CTADETDES2,COALESCE ( COALESCE (CASE COALESCE (( CASE extract(month from CURRENT_TIMESTAMP)" + "                   WHEN '01' THEN CAST(doc.CALIFIINI AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '02' THEN CAST(doc.CALIFIENE AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '03' THEN CAST(doc.CALIFIFEB AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '04' THEN CAST(doc.CALIFIMAR AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '05' THEN CAST(doc.CALIFIABR AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '06' THEN CAST(doc.CALIFIMAY AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '07' THEN CAST(doc.CALIFIJUN AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '08' THEN CAST(doc.CALIFIJUL AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '09' THEN CAST(doc.CALIFIAGO AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '10' THEN CAST(doc.CALIFISEP AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '11' THEN CAST(doc.CALIFIOCT AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '12' THEN CAST(doc.CALIFINOV AS VARCHAR(1) CHARACTER SET iso8859_1)  END),'A')" + "                 WHEN 'A' THEN CTACAP" + "                 WHEN 'B' THEN CTARIESGB" + "                 WHEN 'C' THEN CTARIESGC" + "                 WHEN 'D' THEN CTARIESGD" + "                 WHEN 'E' THEN CTARIESGE" + "                 WHEN 'F' THEN CTARIESGF" + "                 END,CTACAP),0) AS CTACAPITAL," + "                COALESCE ( COALESCE ( CASE COALESCE ((CASE extract(month from CURRENT_TIMESTAMP)" + "                   WHEN '01' THEN CAST(doc.CALIFIINI AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '02' THEN CAST(doc.CALIFIENE AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '03' THEN CAST(doc.CALIFIFEB AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '04' THEN CAST(doc.CALIFIMAR AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '05' THEN CAST(doc.CALIFIABR AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '06' THEN CAST(doc.CALIFIMAY AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '07' THEN CAST(doc.CALIFIJUN AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '08' THEN CAST(doc.CALIFIJUL AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '09' THEN CAST(doc.CALIFIAGO AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '10' THEN CAST(doc.CALIFISEP AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '11' THEN CAST(doc.CALIFIOCT AS VARCHAR(1) CHARACTER SET iso8859_1)" + "                   WHEN '12' THEN CAST(doc.CALIFINOV AS VARCHAR(1) CHARACTER SET iso8859_1)  END),'A')" + "                      WHEN 'A' THEN CTAINT" + "                      WHEN 'B' THEN CTACAUINTB" + "                      WHEN 'C' THEN CTACAUINTC" + "                      WHEN 'D' THEN CTACAUINTD" + "			  WHEN 'E' THEN CTACAUINTE" + "                      WHEN 'F' THEN CTACAUINTF" + "                 END,CTAINT),0) AS CTAINTERES" + "                 FROM docufin doc , lineacre cre" + " WHERE doc.lineacreid= cre.lineacreid" + " AND doc.DOCUFINID=?";
  transaction.query(sql, [docufinid], function (err, id) {

    if (err) return callback(err, null);

    callback(null, id);
  });
}

function EjecutaPagos(poolDB, transaction, listadatos, saldo, recfid, secuencia, bancoid, prefijo, consecutivo, sucid, terid, callback) {

  if (listadatos.length > 0) {
    var listaData = [];
    var saldoApagar = saldo;
    if (saldo > 0) {
      for (var i = 0; i < listadatos.length; i++) {
        var pendienteMora = 0;
        var pendienteInteres = 0;
        var pendienteseguro = 0;
        var pendientecapital = 0;
        // console.log('Mora Inicial',listadatos[i].MORA)
        if (saldo > 0) {
          //mora
          if (listadatos[i].MORA <= saldo) {
            saldo = saldo - listadatos[i].MORA;
            //console.log('Saldo restante:',saldo)
            //console.log('Pendiente mora:',pendienteMora)
          } else {
            pendienteMora = listadatos[i].MORA - saldo;
            //console.log('pendiemte mora:',pendienteMora)
            listadatos[i].MORA = saldo;
            saldo = 0;
          }

          //INTERES
          if (listadatos[i].SALINT <= saldo) {
            saldo = saldo - listadatos[i].SALINT;
            // console.log('Saldo restante:',saldo)
            //console.log('Pendiente Interes:',pendienteInteres)
          } else {
            pendienteInteres = listadatos[i].SALINT - saldo;
            //console.log('pendiemte interes:',pendienteInteres)
            //console.log('abono interes:',saldo)
            listadatos[i].SALINT = saldo;
            saldo = 0;
          }
          //SEGURO


          if (listadatos[i].SEGURO <= saldo) {
            saldo = saldo - listadatos[i].SEGURO;
            // console.log('Saldo restante:',saldo)
            // console.log('Pendiente Seguro:',pendienteseguro)
          } else {
            pendienteseguro = listadatos[i].SEGURO - saldo;
            //console.log('Pendiente Seguro:',pendienteseguro)
            //console.log('abono Seguro:',saldo)
            listadatos[i].SEGURO = saldo;
            saldo = 0;
          }

          //CAPITAL

          if (listadatos[i].SALCAP <= saldo) {
            saldo = saldo - listadatos[i].SALCAP;
            //console.log('Saldo restante:',saldo)
            //console.log('Pendiente Capital:',pendientecapital)
          } else {
            pendientecapital = listadatos[i].SALCAP - saldo;
            //console.log('Pendiente Capital:',pendientecapital)
            //console.log('abono Capital:',saldo)
            listadatos[i].SALCAP = saldo;
            saldo = 0;
          }
          var data = {};
          data.recfid = recfid[0].RECFID;

          data.pago = listadatos[i];
          data.pendientemora = pendienteMora;
          data.pendienteinteres = pendienteInteres;
          data.pendienteseguro = pendienteseguro;
          data.pendientecapital = pendientecapital;
          listaData.push(data);
        } else {

          break;
        }
      }
      // for(var i = 0; i<listaData.length; i++) {
      //   console.log('***************************************')
      //   console.log('RECORRO LISTADATA')
      //   console.log('LISTA ES SU PARTE:',i)
      //   console.log('LISTADATA:',listaData[i])
      //   console.log('***************************************')
      // }
      // console.log('docufinid:',listaData[0].pago.DOCUFINID)
      var docufinid = listaData[0].pago.DOCUFINID;
      // console.log('DATOS DONDE SACO LINEA>>',listaData[0])
      var idlinea = listaData[0].pago.LINEACREID;
      var linea = listaData[0].pago.LINEA;
      var saldo = Number(listaData[0].pago.SALDO);
      var intereses = 0;
      var inserted = 0;
      // console.log('linea',idlinea )
      // console.log('docufinid',docufinid )

      var data = {};
      data.prefijo = prefijo;
      data.numero = consecutivo;
      data.obs = "Abono a lineas " + linea;
      data.totdb = saldoApagar;
      data.totcr = saldoApagar;
      data.sucursal = sucid;
      insertMOVI(transaction, data, function (err, result) {
        if (err) {
          return callback(responseError(err, 2), null);
        }
        getMOVIID(transaction, prefijo, consecutivo, function (err, moviid) {
          if (err) {
            return callback(err, null);
          }
          getCuentasContables(transaction, docufinid, linea, function (err, cuentas) {
            console.log('cuentas contanles eerr', err);
            console.log('cuentas contanles', cuentas);
            // var ctamor = cuentas[0].CTAMOR
            // var ctadetdes2 = cuentas[0].CTADETDES2
            // var ctacapital = cuentas[0].CTACAPITAL
            // var ctainteres = cuentas[0].CTAINTERES
            if (err) {
              return callback(responseError(err, 2), null);
            }
            // console.log('CUENTAS CONTABLES',cuentas)
            var moviId = moviid[0].MOVID;
            // console.log('MOVIID',moviId)
            for (var i = 0; i < listaData.length; i++) {
              var data = listaData[i];
              // console.log('DATA A INSERTAR (OOOOO....OOOOO)',data)
              intereses = intereses + (Number(data.pago.SALCAP) + Number(data.pago.SALINT) + Number(data.pago.SEGURO));
              // console.log('intereses>>',intereses)
              // console.log('el valor de i es ',i)
              // console.log('SALCAP',Number(data.pago.SALCAP))
              // console.log('SALINT',Number(data.pago.SALINT))
              // console.log('SALSEGURO',Number(data.pago.SEGURO))
              // console.log('LA DATA>>>>>%%%',data)
              insertDRECFI(transaction, data, secuencia, moviid, cuentas, terid, listadatos, function (err, result) {
                if (err) {
                  return callback(responseError(err, 2), null);
                }

                if (++inserted == listaData.length) {
                  updateDocufin(transaction, docufinid, saldo - intereses, function (err, result) {

                    if (err) {
                      return callback(responseError(err, 2), null);
                    }
                    insertDRECFIFP(transaction, recfid[0].RECFID, saldoApagar, bancoid, function (err, result) {
                      if (err) {
                        return callback(responseError(err, 2), null);
                      }

                      consultaCuentaBanco(poolDB, bancoid, function (err, cuentaBanco) {
                        if (err) {
                          return callback(responseError(err, 2), null);
                        }
                        var dataContabilidad = {};

                        dataContabilidad.moviid = moviId;
                        dataContabilidad.valortraniif = 0;
                        dataContabilidad.tipocd = 'D';
                        dataContabilidad.terid = terid;
                        dataContabilidad.tipdocum = '';
                        dataContabilidad.nrodocum = '';
                        dataContabilidad.baseret = 0;
                        dataContabilidad.cenid = 1;
                        dataContabilidad.fuenterecid = 1;
                        dataContabilidad.valortra = saldoApagar;
                        dataContabilidad.pucid = cuentaBanco;
                        dataContabilidad.obstra = 'PAGO ONLINE';
                        insertDEMOVI(transaction, dataContabilidad, function (err, result) {
                          if (err) {
                            transaction.rollback();
                            callback(responseError(err, 2), null);
                          }

                          callback(null, responseOK(consecutivo, 2));
                        });
                      });
                    });
                  });
                }
              });
            }
          });
        });
      });
    } else {
      callback(responseError('NO INGRESO UN SALDO VALIDO A PAGAR', 2), null);
    }
  } else {
    callback(responseError('NO HAY SALDO PENDIENTE POR PAGAR', 2), null);
  }
}

function PROCESO_PAGO_DOCUMETO(poolDB, prefijo, terid, total, sucursal, banco, documento, callback) {
  getValidaMaxipoPagar(poolDB, documento, function (err, montoMaximo) {
    if (err) return callback(responseError(err, 2), null);

    if (parseInt(total) > parseInt(montoMaximo[0].TOTAL)) return callback(responseError("VALOR MAXIMO A PAGAR:" + montoMaximo[0].TOTAL, 2), null);
    getConsecutivo(poolDB, prefijo, function (err, consecutivo) {
      if (err) return callback(responseError(err, 2), null);
      //callback(null,consecutivo)
      poolDB.get(function (err, connection) {
        if (err) return callback(responseError(err, 2), null);
        var sql = 'UPDATE CONSECUTIVO SET CONSECUTIVO=? WHERE codcomp=? AND CODPREFIJO=?';
        connection.transaction(_nodeFirebird2.default.ISOLATION_READ_UNCOMMITTED, function (err, transaction) {
          if (err) return callback(responseError(err, 2), null);
          var secuencia = (0, _lpad2.default)(parseInt(consecutivo) + 1, consecutivo.length, "0");

          transaction.query(sql, [secuencia, 'RC', prefijo], // bind value for :id
          function (err, result) {

            if (err) {
              transaction.rollback();
              connection.detach();
              return callback(responseError(err, 2), null);
            }
            getCodigoSucursal(poolDB, sucursal, function (err, sucid) {
              if (err) {
                connection.detach();
                return callback(err, null);
              }
              var data = {};
              data.CODPREFIJO = prefijo;
              data.NUMERO = secuencia;
              data.TERID = terid;
              data.SUCID = sucid;
              data.DETALLE = 'PAGO ONLINE';
              data.TOTAL = total;

              consultaBanco(poolDB, banco, function (err, bcoid) {
                if (err) {
                  connection.detach();
                  return callback(responseError(err, 2), null);
                }

                insertEncabezado(poolDB, transaction, data, function (err, result) {

                  if (err) {
                    transaction.rollback();
                    connection.detach();
                    return callback(responseError(err, 2), null);
                  }

                  getRecfID(transaction, secuencia, prefijo, function (err, recfid) {
                    if (err) {
                      transaction.rollback();
                      connection.detach();
                      return callback(responseError(err, 2), null);
                    }

                    getConsultaSaldos(poolDB, terid, documento, function (err, listaSaldos) {
                      if (err) {
                        transaction.rollback();
                        connection.detach();
                        return callback(responseError(err, 2), null);
                      }

                      EjecutaPagos(poolDB, transaction, listaSaldos, total, recfid, prefijo + secuencia, bcoid, prefijo, secuencia, sucid, terid, function (err, pago) {
                        if (err) {
                          transaction.rollback();
                          connection.detach();
                          return callback(responseError(err, 2), null);
                        }
                        transaction.commit(function (err) {
                          if (err) {
                            transaction.rollback();
                            connection.detach();
                            return callback(responseError(err, 2), null);
                          }

                          callback(null, pago);
                          connection.detach();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

/*SISTEMA X CONCEPTO*****************************************************************/

/*CONSULTA*/
function getConceptos(poolDB, callback) {

  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = 'SELECT CONCID AS DOCUMENTO,CAST(DESCRIP AS VARCHAR(40) CHARACTER SET iso8859_1) as LINEA,  CAST(CODIGO AS VARCHAR(20) CHARACTER SET iso8859_1) as CODIGO,' + ' CTAVAL' + ' FROM CONCEPTO' + ' WHERE CODIGO IN (?,?)';

    connection.query(sql, _conceptos2.default.codigos, function (err, result) {

      if (err) {
        connection.detach();
        return callback(responseError(err.toString(), 4), null);
      }
      callback(null, result);
      connection.detach();
    });
  });
}

function getConsultaConcepto(poolDB, cedula, callback) {
  isUserTNS(poolDB, cedula, function (err, result) {
    if (err) return callback(responseError(err.toString(), 3), null);

    if (!result.length > 0) return callback(responseError('No es un Usuario valido para Coobethel'), null);
    getConceptos(poolDB, function (err, conceptos) {
      if (err) return callback(responseError(err.toString(), 4), null);

      var listaConceptos = [];

      conceptos.map(function (concepto) {

        var resultados = {};
        resultados.TERID = result[0].TERID;
        resultados.NOMBRE = result[0].NOMBRE;
        resultados.DOCUMENTO = concepto.DOCUMENTO;
        resultados.LINEA = concepto.LINEA;
        resultados.CODIGO = concepto.CODIGO;
        resultados.CTAVAL = concepto.CTAVAL;
        resultados.TOTAL = 0;
        listaConceptos.push(resultados);
      });
      //resultados.conceptos = conceptos
      callback(null, responseOK(listaConceptos, 3));
    });
  });
}

/*PAGO*/
function getCuentaConcepto(poolDB, concid, callback) {
  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = 'SELECT CTAVAL FROM CONCEPTO WHERE CONCID =?';
    connection.query(sql, concid, function (err, result) {
      if (err) {
        connection.detach();
        return callback(err, null);
      }

      if (result.length <= 0) {
        connection.detach();
        return callback('CONCEPTO [' + concid + '] NO VALIDO.', null);
      }
      callback(null, result[0].CTAVAL);
      connection.detach();
    });
  });
}

function insertDRECFIConcepto(transaction, data, callback) {
  var sql = ' INSERT INTO DRECFI (RECFID,DDOCUCUID,ABCAP,ABINT,ABMOR,ABDCTO1,ABDCTO2,CONCID,TERID,INTNOGEN,DTO1NOGEN,DTO2NOGEN,ABEXCEDE,ABFALTANTE)' + ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  transaction.query(sql, [data.recfiid, 1, data.total, 0, 0, 0, 0, data.concid, data.terid, 0, 0, 0, 0, 0], function (err, result) {
    if (err) {
      transaction.rollback();
      callback(err, null);
    }
    callback(null, result);
  });
}

function insertDEMOVIConcepto(transaction, data, callback) {
  var sql = ' INSERT INTO DEMOVI (MOVID,PUCID,VALORTRA,VALORTRANIIF,TIPOCD,TERID,OBSTRA, BASERET,CENID,FUENTERECID,SIGNO)' + ' VALUES (?,?,?,?,?,?,?,?,?,?,?)';
  transaction.query(sql, [data.moviid, data.pucid, data.total, 0, 'C', data.terid, data.obs, 0, 1, 1, -1], function (err, result) {
    if (err) {
      transaction.rollback();
      callback(err, null);
    }
    callback(null, result);
  });
}

function insertDEMOVIConceptoFP(transaction, data, callback) {
  var sql = ' INSERT INTO DEMOVI (MOVID,PUCID,VALORTRA,VALORTRANIIF,TIPOCD,TERID,OBSTRA, BASERET,CENID,FUENTERECID,SIGNO)' + ' VALUES (?,?,?,?,?,?,?,?,?,?,?)';
  transaction.query(sql, [data.moviid, data.pucid, data.total, 0, 'D', data.terid, data.obs, 0, 1, 1, 1], function (err, result) {
    if (err) {
      transaction.rollback();
      callback(err, null);
    }
    callback(null, result);
  });
}

function setPagoxConsultaConcepto(poolDB, data, callback) {
  var prefijo = data.prefijo,
      terid = data.terid,
      total = data.total,
      sucursal = data.sucursal,
      banco = data.banco,
      concepto = data.concepto;

  isUserTNSByTerid(poolDB, terid, function (err, teridvalido) {
    if (err) return callback(responseError(err.toString(), 4), null);
    getCodigoSucursal(poolDB, sucursal, function (err, sucid) {
      if (err) return callback(responseError(err.toString(), 4), null);
      consultaBanco(poolDB, banco, function (err, bancoid) {
        if (err) return callback(responseError(err.toString(), 4), null);
        consultaCuentaBanco(poolDB, bancoid, function (err, ctaBanco) {
          if (err) return callback(responseError(err.toString(), 4), null);
          getCuentaConcepto(poolDB, concepto, function (err, ctaval) {
            if (err) return callback(responseError(err.toString(), 4), null);
            getConsecutivo(poolDB, prefijo, function (err, consecutivo) {
              if (err) return callback(responseError(err.toString(), 4), null);
              poolDB.get(function (err, connection) {
                if (err) return callback(responseError(err, 4), null);
                var sql = 'UPDATE CONSECUTIVO SET CONSECUTIVO=? WHERE codcomp=? AND CODPREFIJO=?';
                connection.transaction(_nodeFirebird2.default.ISOLATION_READ_UNCOMMITTED, function (err, transaction) {
                  if (err) return callback(responseError(err, 4), null);
                  var secuencia = (0, _lpad2.default)(parseInt(consecutivo) + 1, consecutivo.length, "0");
                  transaction.query(sql, [secuencia, 'RC', prefijo], function (err, result) {

                    if (err) {
                      transaction.rollback();
                      return callback(responseError(err, 4), null);
                    }
                    var data = {};
                    data.CODPREFIJO = prefijo;
                    data.NUMERO = secuencia;
                    data.TERID = terid;
                    data.SUCID = sucid;
                    data.DETALLE = 'PAGO ONLINE';
                    data.TOTAL = total;
                    insertEncabezado(poolDB, transaction, data, function (err, result) {
                      if (err) {
                        transaction.rollback();
                        return callback(responseError(err, 4), null);
                      }
                      getRecfID(transaction, secuencia, prefijo, function (err, recfid) {
                        if (err) {
                          transaction.rollback();
                          return callback(responseError(err, 4), null);
                        }
                        var data = {};
                        data.recfiid = recfid[0].RECFID;
                        data.total = total;
                        data.concid = concepto;
                        data.terid = terid;
                        insertDRECFIConcepto(transaction, data, function (err, resultdb) {
                          if (err) {
                            transaction.rollback();
                            return callback(responseError(err, 4), null);
                          }
                          insertDRECFIFP(transaction, recfid[0].RECFID, total, bancoid, function (err, resultfpdb) {
                            if (err) {
                              transaction.rollback();
                              return callback(responseError(err, 4), null);
                            }
                            var data = {};
                            data.prefijo = prefijo;
                            data.numero = secuencia;
                            data.obs = 'PAGO ONLINE';
                            data.totdb = total;
                            data.totcr = total;
                            data.sucursal = sucid;
                            insertMOVI(transaction, data, function (err, result) {
                              if (err) {
                                transaction.rollback();
                                return callback(responseError(err, 4), null);
                              }
                              getMOVIID(transaction, prefijo, secuencia, function (err, moviid) {
                                if (err) {
                                  transaction.rollback();
                                  return callback(responseError(err, 4), null);
                                }
                                var MOVID = moviid[0].MOVID;
                                var data = {};
                                data.moviid = MOVID;
                                data.pucid = ctaval;
                                data.total = total;
                                data.terid = terid;
                                data.obs = 'PAGO ONLINE';
                                insertDEMOVIConcepto(transaction, data, function (err, resultdemovi) {
                                  if (err) {
                                    transaction.rollback();
                                    return callback(responseError(err, 4), null);
                                  }
                                  data.pucid = ctaBanco;
                                  insertDEMOVIConceptoFP(transaction, data, function (err, resultdemovifp) {
                                    if (err) {
                                      transaction.rollback();
                                      return callback(responseError(err, 4), null);
                                    }
                                    transaction.commit(function (err) {
                                      if (err) {
                                        transaction.rollback();
                                        return callback(responseError(err, 4), null);
                                      }

                                      callback(null, responseOK(secuencia, 4));
                                      connection.detach();
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              }); //poolDB
            }); //consecutivo
          });
        });
      }); //bancoid
    }); //sucursal
  });
}

// //BORRAR EL MOVI
// DELETE FROM MOVI WHERE CODCOMP="RC" AND CODPREFIJO="JP" AND NUMERO="00032"
//
// //BORRAR FORMA DE PAGO
// delete from drecfifp
// where recfid=(select recfid from recfi where codprefijo="JP" and numero="00032")
//
// //BORRAR DETALLES CON CONCEPTO
// delete from drecfi
// where recfid=(select recfid from recfi where codprefijo="JP" and numero="00032")
// and ddocucuid=1 and terid is not null and concid is not null
function deleteMovi(transaction, data, callback) {
  var sql = 'DELETE FROM MOVI WHERE CODCOMP=? AND CODPREFIJO=? AND NUMERO=?';
  transaction.query(sql, ["RC", data.prefijo, data.consecutivo], function (err, result) {
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    callback(null, result);
  });
}

function deleteDeMovi(transaction, data, callback) {
  var sql = 'DELETE FROM DEMOVI WHERE MOVID = (SELECT MOVID FROM MOVI WHERE CODCOMP=? AND CODPREFIJO=? AND NUMERO=?)';
  transaction.query(sql, ["RC", data.prefijo, data.consecutivo], function (err, result) {
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    callback(null, result);
  });
}

function deleteformaPago(transaction, data, callback) {
  var sql = 'delete from drecfifp where recfid=(select recfid from recfi where codprefijo=? and numero=?)';
  transaction.query(sql, [data.prefijo, data.consecutivo], function (err, result) {
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    callback(null, result);
  });
}

function deleteConceptos(transaction, data, callback) {
  var sql = 'delete from drecfi where recfid=(select recfid from recfi where codprefijo=? and numero=?) and ddocucuid=1 and terid is not null and concid is not null';
  transaction.query(sql, [data.prefijo, data.consecutivo], function (err, result) {
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    callback(null, result);
  });
}

function updateTerceroAnulado(transaction, data, callback) {
  var fecasent = (0, _moment2.default)(new Date()).format("MM/DD/YYYY");
  var sql = 'UPDATE RECFI SET TERID=(SELECT FIRST 1 TERID FROM TERCEROS WHERE NOMBRE=?), FECASENT=? WHERE CODPREFIJO=? AND NUMERO=?';
  transaction.query(sql, ["ANULADO", fecasent, data.prefijo, data.consecutivo], function (err, result) {
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    console.log(result);
    console.log('error', err);
    callback(null, result);
  });
}

function updateMoviAnulacion(transaction, data, callback) {

  var sql = ' UPDATE MOVI MV SET FECHA = (SELECT FECHA FROM RECFI WHERE CODPREFIJO=MV.CODPREFIJO AND NUMERO=MV.NUMERO) ,' + ' PERIODO = (SELECT PERIODO FROM RECFI WHERE CODPREFIJO=MV.CODPREFIJO AND NUMERO=MV.NUMERO),' + ' FECASENT = (SELECT FECASENT FROM RECFI WHERE CODPREFIJO=MV.CODPREFIJO AND NUMERO=MV.NUMERO),' + ' TOTDB=?,TOTCR=?,TOTDBNIIF=?,TOTCRNIIF=?' + ' WHERE CODPREFIJO=? AND NUMERO=?';
  transaction.query(sql, [0, 0, 0, 0, data.prefijo, data.consecutivo], function (err, result) {
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    callback(null, result);
  });
}

function updateDocufinAnulacion(transaction, data, callback) {
  var sql = ' UPDATE DOCUFIN  SET SALDO=SALDO+? WHERE DOCUFINID=?';

  transaction.query(sql, [data.saldo, data.docufinid], function (err, result) {
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    callback(null, result);
  });
}

function updateDDocucuAnulacion(transaction, data, callback) {
  var sql = ' UPDATE DDOCUCU SET SALCAP=SALCAP+?,SALINT=SALINT+?,' + ' SALDTO1=SALDTO1+?,SALDTO2=SALDTO2+?, FECULPAGO=?,DOCULPAGO=?' + ' WHERE DDOCUCUID=?';

  if (data.FECULPAGO) {
    var data1 = [data.abcap, data.abint, data.abdcto1, data.abdcto2, data.FECULPAGO, data.DOCULPAGO, data.ddocucuid];
  } else {
    var data1 = [data.abcap, data.abint, data.abdcto1, data.abdcto2, null, null, data.ddocucuid];
  }

  transaction.query(sql, data1, function (err, result) {
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    callback(null, result);
  });
}

function getUltimoPagoDdocucu(transaction, poolDB, data, dataAct, callback) {
  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = ' SELECT FIRST 1  CAST( MAX(R.FECHA) AS date) AS FECULPAGO,' + ' CAST (R.CODPREFIJO||R.NUMERO AS VARCHAR(10) CHARACTER SET iso8859_1) AS DOCULPAGO' + ' FROM RECFI R INNER JOIN DRECFI DR ON (R.RECFID=DR.RECFID)' + ' WHERE DR.DDOCUCUID=? AND R.CODPREFIJO||R.NUMERO<>?' + ' AND R.FECASENT IS NOT NULL' + ' GROUP BY 2' + ' ORDER BY FECULPAGO DESC';

    connection.query(sql, [data.docucu, data.prefconse], function (err, result) {
      if (err) return callback(err, null);

      if (result[0]) {

        dataAct.FECULPAGO = result[0].FECULPAGO;
        dataAct.DOCULPAGO = result[0].DOCULPAGO;
      } else {
        dataAct.FECULPAGO = '';
        dataAct.DOCULPAGO = '';
      }
      updateDDocucuAnulacion(transaction, dataAct, function (err, result) {
        if (err) {
          connection.detach();
          return callback(err, null);
        }
        callback(null, result);
      });
      //callback(null,result)
      connection.detach();
    });
  });
}
function getDeRecfiAnulacion(poolDB, data, callback) {
  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = ' SELECT D.DOCUFINID,SUM(ABCAP+ABINT+ABDCTO1+ABDCTO2)AS ABSALDO' + ' FROM DRECFI DR INNER JOIN RECFI R ON (DR.RECFID=R.RECFID)' + ' INNER JOIN DDOCUCU DD ON (DR.DDOCUCUID = DD.DDOCUCUID)' + ' INNER JOIN DOCUFIN D ON (DD.DOCUFINID = D.DOCUFINID)' + ' WHERE R.CODPREFIJO=? AND R.NUMERO=?' + ' AND R.FECASENT IS NOT NULL AND D.DOCUFINID<>1' + ' GROUP BY D.DOCUFINID';
    connection.query(sql, [data.prefijo, data.consecutivo], function (err, result) {
      if (err) {
        connection.detach();
        return callback(err, null);
      }
      callback(null, result);
      connection.detach();
    });
  });
}

function getValidaMaxipoPagar(poolDB, codigoDocumento, callback) {
  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = ' SELECT SUM (MORA) TOTAL' + ' FROM' + ' (SELECT DD.DDOCUCUID,(DD.SALCAP + DD.SALINT + DD.SALDTO1 + DD.SALDTO2 +' + ' IIF(sum (ceil (((dd.salcap*(d.intmor/100))/30)*(datediff(day,dd.fecvence,CURRENT_TIMESTAMP)))) -' + ' (SELECT coalesce(SUM (DR1.ABMOR),0)' + ' FROM RECFI R1 INNER JOIN DRECFI DR1 ON (R1.RECFID=DR1.RECFID)' + ' WHERE DR1.DDOCUCUID=DD.DDOCUCUID AND R1.FECASENT IS NOT NULL)<0,0,' + ' sum (ceil (((dd.salcap*(d.intmor/100))/30)*(datediff(day,dd.fecvence,CURRENT_TIMESTAMP)))) -' + ' (  SELECT coalesce(SUM (DR1.ABMOR),0)' + ' FROM RECFI R1 INNER JOIN DRECFI DR1 ON (R1.RECFID=DR1.RECFID)' + ' WHERE DR1.DDOCUCUID=DD.DDOCUCUID AND R1.FECASENT IS NOT NULL))) AS MORA' + ' FROM DOCUFIN D INNER JOIN DDOCUCU DD ON (D.DOCUFINID=DD.DOCUFINID)' + ' WHERE (DD.SALCAP>0 OR DD.SALINT> 0 OR DD.SALDTO1>0 OR DD.SALDTO2>0)' + ' AND D.FECASENT IS NOT NULL AND D.CODCOMP||D.CODPREFIJO||D.NUMERO=?' + ' GROUP BY DD.DDOCUCUID,DD.SALCAP ,DD.SALINT ,DD.SALDTO1,DD.SALDTO2) AS MORA';
    connection.query(sql, [codigoDocumento], function (err, result) {
      if (err) {
        connection.detach();
        return callback(err, null);
      }
      callback(null, result);
      connection.detach();
    });
  });
}

function getDeRecfiDdocucu(poolDB, data, callback) {
  poolDB.get(function (err, connection) {
    if (err) return callback(err, null);
    var sql = ' SELECT DR.DDOCUCUID, COALESCE( DR.ABCAP,0) AS ABCAP , COALESCE( DR.ABINT,0) AS ABINT,' + ' COALESCE(DR.ABDCTO1,0) AS ABDCTO1, COALESCE(DR.ABDCTO2,0) AS ABDCTO2' + ' FROM DRECFI DR INNER JOIN RECFI R ON (DR.RECFID=R.RECFID)' + ' WHERE R.CODPREFIJO=? AND R.NUMERO=?' + ' AND R.FECASENT IS NOT NULL AND DR.DDOCUCUID<>1' + ' ORDER BY DR.DDOCUCUID';
    connection.query(sql, [data.prefijo, data.consecutivo], function (err, result) {
      if (err) {
        connection.detach();
        return callback(err, null);
      }
      callback(null, result);
      connection.detach();
    });
  });
}

function insertMOVIAnulacion(transaction, data, callback) {
  var fecasent = (0, _moment2.default)(new Date()).format("MM/DD/YYYY");
  var fecha = (0, _moment2.default)(data.fecha).format("MM/DD/YYYY");
  var sql = ' INSERT INTO MOVI (CODCOMP,CODPREFIJO,NUMERO,OBS,FECHA,TOTDB,TOTCR,FECASENT,PERIODO,AREADID,SUCID,IMPORTADO,USUARIO,' + ' TOTDBNIIF,TOTCRNIIF) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  transaction.query(sql, ['RC', data.prefijo, data.numero, data.obs, fecha, 0, 0, fecasent, data.periodo, 1, data.sucursal, 'S', 'WS', 0, 0], function (err, result) {
    // bind value for :id
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    transaction.commit(function (err) {
      if (err) {
        transaction.rollback();
        return callback(err, null);
      }
      callback(null, 'OK');
    });
  });
}
function insertAREA(transaction, data, callback) {

  var sql = 'INSERT INTO AREAD (CODAREAD,NOMAREAD) VALUES (?,?)';
  transaction.query(sql, [data.id, data.nombre], function (err, result) {
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    transaction.commit(function (err) {
      if (err) {
        transaction.rollback();
        return callback(err, null);
      }

      callback(null, 'OK');
    });
  });
}

function deleteDrecfiAnulacion(transaction, data, callback) {
  var sql = 'delete from drecfi where recfid=(select recfid from recfi where codprefijo=? and numero=?)';
  transaction.query(sql, [data.prefijo, data.consecutivo], function (err, result) {
    if (err) {
      transaction.rollback();
      return callback(err, null);
    }
    callback(null, result);
  });
}

function getValidaANULACION(poolDB, data, callback) {
  console.log('entro en la anulacion');
  poolDB.get(function (err, connection) {

    if (err) return callback(err, null);
    //var sql ='select recfid from recfi where codprefijo=? and numero=? AND FECASENT IS NOT NULL'
    var sql = " SELECT r.recfid, trim (iif(t.nombre='ANULADO','ANULADO','' )) ANULADO" + " FROM recfi r INNER JOIN terceros t ON (R.TERID=T.TERID)" + " WHERE codprefijo=? AND numero=? AND FECASENT IS NOT NULL";
    //SI CAMPO DE LA CONSULTA DE VUELVE ANULADO, ENTONCES EXISTE EL RECIBO
    //PERO YA FUE CREADO CON TERCERO ANULADO O YA FUE ANULADO.
    //SI DEVUELVE VACIO EXISTE EL RECIBO Y SE PUEDE ANULAR
    connection.query(sql, [data.prefijo, data.consecutivo], function (err, result) {
      console.log('AQUI', result);
      if (err) {
        connection.detach();
        return callback(err, null);
      }

      if (!result[0]) {
        connection.detach();
        return callback('PREFIJO O CONSECUTIVO NO VALIDO.', null);
      }
      callback(null, result);
      connection.detach();
    });
  });
}

/*
         function getValidaANULACION(poolDB,data, callback) {
           console.log('entro en la anulacion')
           poolDB.get(function(err, connection) {


               if(err) return callback(err,null)
               var sql ='select recfid from recfi where codprefijo=? and numero=? AND FECASENT IS NOT NULL'

               connection.query(sql,[data.prefijo,data.consecutivo],function(err, result) {

                 if(err) {
                   connection.detach();
                   return callback(err,null)
                 }

                 if(result.length<=0) {
                   connection.detach();
                   return callback('PREFIJO O CONSECUTIVO NO VALIDO.',null)}
                  callback(null,result)
                  connection.detach();
               })
            })
         }
*/

function setanulaxConcepto(poolDB, data, callback) {
  var inserted = 0;
  var inserted2 = 0;
  data.prefijo = data.prefijo.toUpperCase();

  poolDB.get(function (err, connection) {
    if (err) return callback(responseError(err, 5), null);
    connection.transaction(_nodeFirebird2.default.ISOLATION_READ_UNCOMMITTED, function (err, transaction) {
      if (err) return callback(responseError(err, 5), null);

      getValidaANULACION(poolDB, data, function (err, resultDB) {
        if (err) return callback(responseError(err, 5), null);
        if (resultDB[0].ANULADO.length <= 0) {

          if (err) return callback(responseError(err, 5), null);
          updateTerceroAnulado(transaction, data, function (err, result) {
            console.log(result);
            //if(result){

            if (err) {
              console.log('ENTRO AL ERROR');
              transaction.rollback();
              connection.detach();
              return callback(responseError(err, 5), null);
            }
            updateMoviAnulacion(transaction, data, function (err, result) {
              console.log('HAGO EL UPDATE MOVIANULACION');
              if (err) {
                console.log('ENTRO ERRROR DE  MOVIANULACION');
                transaction.rollback();
                connection.detach();
                return callback(responseError(err, 5), null);
              }
              console.log('HAGO EL DELEDEMOVI');
              deleteDeMovi(transaction, data, function (err, result) {
                if (err) {
                  transaction.rollback();
                  connection.detach();
                  return callback(responseError(err, 5), null);
                }
                deleteformaPago(transaction, data, function (err, result) {
                  if (err) {
                    transaction.rollback();
                    connection.detach();
                    return callback(err, null);
                  }
                  deleteConceptos(transaction, data, function (err, result) {
                    if (err) {
                      transaction.rollback();
                      connection.detach();
                      return callback(responseError(err, 5), null);
                    }
                    getDeRecfiAnulacion(poolDB, data, function (err, resultQ) {
                      if (err) {
                        transaction.rollback();
                        connection.detach();
                        return callback(responseError(err, 5), null);
                      }

                      for (var i = 0; i < resultQ.length; i++) {

                        var dataAct = {};
                        dataAct.saldo = resultQ[i].ABSALDO;
                        dataAct.docufinid = resultQ[i].DOCUFINID;
                        updateDocufinAnulacion(transaction, dataAct, function (err, result) {
                          if (err) {
                            transaction.rollback();
                            return callback(responseError(err, 5), null);
                          }
                          if (++inserted == resultQ.length) {

                            getDeRecfiDdocucu(poolDB, data, function (err, resultR) {
                              if (err) {
                                transaction.rollback();
                                connection.detach();
                                return callback(responseError(err, 5), null);
                              }

                              for (var j = 0; j < resultR.length; j++) {
                                var dataAct = {};

                                dataAct.ddocucuid = resultR[j].DDOCUCUID;
                                dataAct.abcap = resultR[j].ABCAP;
                                dataAct.abint = resultR[j].ABINT;
                                dataAct.abdcto1 = resultR[j].ABDCTO1;
                                dataAct.abdcto2 = resultR[j].ABDCTO2;
                                var dataDocucu = {};
                                dataDocucu.docucu = resultR[j].DDOCUCUID;
                                dataDocucu.prefconse = data.prefijo + data.consecutivo;

                                getUltimoPagoDdocucu(transaction, poolDB, dataDocucu, dataAct, function (err, resultDD) {
                                  if (err) {
                                    transaction.rollback();
                                    connection.detach();
                                    return callback(responseError(err, 5), null);
                                  }

                                  // updateDDocucuAnulacion(transaction, dataAct, (err,result)=> {
                                  // if (err) {
                                  //    transaction.rollback()
                                  //    return callback(err,null)
                                  //  }

                                  if (++inserted2 == resultR.length) {
                                    deleteDrecfiAnulacion(transaction, data, function (err, result) {
                                      if (err) {
                                        transaction.rollback();
                                        connection.detach();
                                        return callback(responseError(err, 5), null);
                                      }

                                      transaction.commit(function (err) {
                                        if (err) {
                                          transaction.rollback();
                                          connection.detach();
                                          return callback(responseError(err, 5), null);
                                        }
                                        callback(null, responseOK('ELIMINACION CORRECTA', 5));
                                        connection.detach();
                                      });
                                    });
                                  }
                                  //})//update
                                });
                              }
                            });
                          }
                        });
                      }
                    }); // getDeRecfiAnulacion
                  }); //deleteConceptos
                }); //deleteformaPago
              }); //deleteDeMovi
            }); //getRecfiAnulacion

            // }
            // else{
            //   transaction.rollback()
            //   connection.detach();
            //   return callback(responseError("PREFIJO NO VALIDO",5),null)
            // }
          }); //updateTerceroAnulado
        } else {
          connection.detach();
          return callback(responseError('CONSECUTIVO YA ANULADO', 5), null);
        }
      });
    }); //transaction
  }); //polldb

} //function