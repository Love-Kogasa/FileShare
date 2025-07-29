const ini = require( "ini" )
const url = require( "url" )
const path = require( "path" )
const fs = require( "fs" )

function parse( code ){
  var request = { description: "网络文件", proxy: false, option: {} }
  switch( code.trim()[0] ){
  case "@":
    request.proxy = true
    request.subject = code.slice( 1 )
    break;
  case "[":
    var config = ini.parse(code)
    request.proxy = true
    request.subject = config.subject.url
    request.option.method = config.subject.method
    if( parseInt(config.subject.json) ){
      request.option.body = JSON.stringify(config.body)
      request.option.headers[ "content-type" ] = "application/json"
    } else {
      request.option.body = config.subject.body
    }
    if( config.subject.description )
      request.description = config.subject.description
    Object.assign( request.option.headers, (config.headers || {}))
    break;
  default:
    request.subject = code
    break;
  }
  request.subject = url.format(url.parse(request.subject))
  if( request.subject.slice( -1 ) == "/" )
    request.subject += "index.html"
  return request
}

async function handle( codePath, route, req, reply ){
  if( fs.existsSync( codePath )){
    var {subject, option, proxy} = parse( fs.readFileSync( codePath ).toString() )
    if( !proxy ){
      reply.redirect( subject )
      return; }
    var response = (await fetch( subject, option ))
    if( response.status > 400 ){
      reply.send( "Cannot Proxy " + subject )
      return; }
    reply.raw.writeHead( response.status, { "content-type": response.headers.get( "content-type" ) } )
    var stream = response.body.getReader()
    await read()
    async function read(){
      let {done, value} = await stream.read()
      if( done ) return;
      reply.raw.write( Buffer.from( value ) )
      await read()
    }
    reply.raw.end()
  } else {
    reply.redirect( path.dirname( req.url.replace( route, "" ) ) )
  }
}

module.exports = {parse, handle}