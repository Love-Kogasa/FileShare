const fs = require( "fs" ),
  {getRealPath, config} = require( "../config" ),
  path = require( "path" )

module.exports = ( req, reply ) => {
  var sitemap = []
  fs.readdirSync( getRealPath( "/" ), {recursive: true} ).forEach(( pathname ) => {
    sitemap.push( encodeURI(path.join( config.data.domain, pathname ).replace( ":/", "://" ) ) )
  })
  reply.header( "content-type", "text/plain" )
  reply.send( sitemap.join( "\n" ) )
}