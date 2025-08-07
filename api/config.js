const ini = require( "./ini" ),
  fs = require( "fs" ),
  path = require( "path" )

function pathmini( url ) {
  if( url.split( "/" ).length <= 3 ) return url
  var urllist = []
  for( let part of path.dirname(url).split( "/" ) ){
    urllist.push( part[0])
  }
  return urllist.concat( path.basename( url ) ).join( "/" )
}

function getRealURL( url ) {
  return path.join( "/public", path.join(config.data.files, url))
}

function getRealPath( url ) {
  return path.join( __dirname + "/../public", path.join(config.data.files, url))
}

var config = ini.parse( fs.readFileSync( __dirname + "/../config.ini" ).toString() )

module.exports = {config, pathmini, getRealURL, getRealPath}