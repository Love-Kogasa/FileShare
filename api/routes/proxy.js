const fnet = require( "../fsurl" ),
  {getRealPath} = require( "../config" )

module.exports = ( req, reply ) => {
  var url = decodeURIComponent(req.url.replace( "/proxy", "" ))
  try {
    fnet.handle( getRealPath( url ), "/proxy", req, reply )
  } catch(err){
    reply.code( 500 )
    reply.send( "这里发生了一个服务端错误" )
  }
}