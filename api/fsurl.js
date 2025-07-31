const ini = require( "ini" )
const url = require( "url" )
const path = require( "path" )
const fs = require( "fs" )
const template = require( "template-string" )

// 网络文件
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

// 网络目录
var dirSupportType = [
  "v-fileshare"
]
async function parsed( requestPath ){
  var pathdt = getDPath(requestPath)
  if( !pathdt ){
    console.error( new TypeError( "路径错误，可能是文件不存在" ) )
    return false
  }
  var code = fs.readFileSync( pathdt.fpath ).toString()
  var {config} = ini.parse( code )
  var diroutput = [], readme = "", empty = true
  if( !dirSupportType.includes(config.type) ) {
    console.error( new TypeError( "不支持的网络目录格式" ) )
    return {diroutput, readme, empty}
  } 
  var handles = {
    "v-fileshare": async function( config ){
      var json = await (await fetch( path.join( config[ "for" ], pathdt.vpath ) )).json()
      var urlObject = url.parse(config[ "for" ])
      json.protocol = urlObject.protocol + "//"
      json.imgPreviewer = path.join( urlObject.host, "previewer", pathdt.vpath )
      if( json.string ){
        // 处理文件
        var subjectConfig = await (await fetch( json.protocol + path.join( urlObject.host, "config" ) )).json()
        json.toString = () => json.string
        json.downloadContext.path = json.protocol + path.join( urlObject.host, json.downloadContext.path )
        json.download = template( fs.readFileSync( __dirname + "/../public/_down.html" ).toString(), json.downloadContext || {})
      }
      return json
    }
  }
  return await handles[config.type](config)
}
function getDPath( filepath ){
  var passpart = []
  for( let part of filepath.split( "/" ) ){
    if( path.extname( part ) == ".fsdurl" ){
      var realpath = (filepath[0] === "/" ? "/" : "") + path.join(...passpart.concat( part ))
      return {
        fpath: realpath,
        vpath: filepath.replace( realpath, "" )
      }
    } else {
      passpart.push( part )
    }
  }
}
function isOnlineDir( url ){
  for( let part of url.split( "/" ) )
    if( path.extname( part ) == ".fsdurl" ) return true
  return false
}

module.exports = {parse, handle, parsed, isOnlineDir}