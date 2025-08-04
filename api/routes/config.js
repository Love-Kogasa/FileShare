var {config} = require( "../config" )
module.exports = ( req, reply ) => {
  reply.header( "content-type", "application/json" )
  reply.send( config )
}