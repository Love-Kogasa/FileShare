const {Jimp} = require( "jimp" ),
  {getRealPath} = require( "../config" )

module.exports = async ( req, reply ) => {
  var image = await Jimp.read( getRealPath( decodeURIComponent( req.url ).replace( "/previewer", "" ) ))
  image.resize( { w: 64, h: 64 } )
  reply.header( "content-type", "image/png")
  reply.send((await image.getBuffer( "image/png" )))
}