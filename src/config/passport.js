import passportjwt from 'passport-jwt'
import User from 'models/User'
import Config from 'config'
import passport from 'passport'
var JwtStrategy = passportjwt.Strategy
var ExtractJwt  = passportjwt.ExtractJwt
export function prueba(){
  console.log('ENTRO a test')
   var opts = {}
   opts.jwtFromRequest = ExtractJwt.fromAuthHeader()
   opts.secretOrKey = Config.TOKEN_SECRET
   passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
     console.log(done)
     console.log('ID',jwt_payload.id)
   }))

}
