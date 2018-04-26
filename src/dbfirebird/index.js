import Firebird from 'node-firebird'
import configDB from 'conexiones'

export default Firebird.pool(5, configDB);
