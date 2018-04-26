import  http from 'http'
import  express from 'express'
import  bodyParser from 'body-parser'
import  methodOverride from 'method-override'
import  mongoose from 'mongoose'
import Firebird from 'node-firebird'
import passport from 'passport'
//import socketio from 'socket.io'
//import redis from 'socket.io-redis'
import  api from 'api'
import  usuario from 'api/usuario'
import  coobethel from 'api/coobethel'

import cors from 'cors';
import poolFirebird from 'dbfirebird'




const app = express()
const server = http.createServer(app)

const port = process.env.PORT || 3002
//const database = process.env.MONGOLAB_URI || 'mongodb://appdb:coobethel2017@127.0.0.1:6667/coobethel'
//mongoose.connect(database, onDBConnect)

server.on('listening', onListening)
server.listen(port)
  app.use(bodyParser.urlencoded({extended: true }))
  app.use(bodyParser.json())
  app.use(methodOverride())
  app.use(cors());
  app.use(passport.initialize())

/*
  app.all('*',(req,res,next)=> {
      logger.info(req.method, req.url)
      next()
  })
  */

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

 app.use('/coobethel',coobethel)
 app.use('/usuarios',usuario)

/*
function onDBConnect (err, res) {
  if (err) console.log(`ERROR: on connecting to database, ${err}`)
  else {
    global.pool = poolFirebird
    console.log(`Connection established to Database`)
    server.listen(port)
  }
}*/

function onListening () {
  global.pool = poolFirebird
  console.log(`Connection established to Database`)

  console.log(`Server listening on http://localhost:${port}`)
}
