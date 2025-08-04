const fs = require( "fs" ),
  {getRealPath, config} = require( "../config" )

module.exports = ( req, reply ) => {
  var sitemap = []
  fs.readdirSync( getRealPath( "/" ), {recursive: true} ).forEach(( pathname ) => {
    sitemap.push( encodeURI(path.join( config.data.domain, pathname )) )
  })
  reply.header( "content-type", "text/plain" )
  reply.send( sitemap.join( "\n" ) )
}