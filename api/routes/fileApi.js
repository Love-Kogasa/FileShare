const {getPathData: getPath} = require( "../api" )

module.exports = ( req, reply ) => {
  reply.header( "content-type", "application/json" )
  var output = getPath( decodeURIComponent(req.url.replace( "/fileApi", "" )))
  reply.send(JSON.stringify(output))
}