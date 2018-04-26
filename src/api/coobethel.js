import express from 'express'
import User from 'models/User'
import {setanulaxConcepto,getConsultaConcepto,setPagoxConsultaConcepto,getConsultaDeudaProducto,getConsultaDeudaSinVencer,PROCESO_PAGO_DOCUMETO,getCodigoSucursal} from 'utildb'
const router = express();


router.post('/consulta-saldo',(req,res)=> {
  getConsultaDeudaProducto(global.pool,req.body.cedula,(err, result)=>{
    if(err) return res.status(500).json(err)
    res.json(result)
  })
})




router.post('/pago-documento',(req,res)=> {
  PROCESO_PAGO_DOCUMETO(global.pool,req.body.prefijo,req.body.terid,req.body.total,req.body.sucursal,req.body.banco,req.body.documento,(err, result)=>{

    if(err) return res.status(500).json(err)
    res.json(result)
  })
})
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
router.post('/consulta-concepto',(req,res)=> {

  getConsultaConcepto(global.pool,req.body.cedula,(err, result)=> {
    if(err) return res.status(500).json(err)
    res.json(result)
  })
})

router.post('/pago-concepto',(req,res)=> {

  setPagoxConsultaConcepto(global.pool,req.body,(err, result)=> {
    if(err) return res.status(500).json(err)
    res.json(result)
  })
})


router.post('/anula-concepto',(req,res)=> {

  setanulaxConcepto(global.pool,req.body,(err, result)=> {
    if(err) return res.status(500).json(err)
    res.json(result)
  })
})

export default router
