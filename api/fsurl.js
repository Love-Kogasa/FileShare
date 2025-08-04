const ini = require( "ini" )
const url = require( "url" )
const path = require( "path" )
const fs = require( "fs" )
const template = require( "template-string" )
const fsize = require( "file-size" )

var {config: selfConfig} = require( "./config" )

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

async function handle( codePath, route, req, reply, actually ){
  if( actually || fs.existsSync( codePath ) ){
    if( typeof actually !== "string" ){
      var {subject, option, proxy} = parse( fs.readFileSync( codePath ).toString() )
      if( !proxy ){
        reply.redirect( subject )
        return; }
    } else {
      var subject = actually
      var option = option
    }
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
  } else if( isOnlineDir( codePath ) ){
    console.log(codePath)
    var file = await parsed( codePath, req.url )
    if( file.proxy && file.downloadContext.source ){
      handle( null, route, req, reply, file.downloadContext.source )
    } else {
      reply.redirect( path.dirname( req.url.replace( route, "" ) ) )
    }
  } else {
    reply.redirect( path.dirname( req.url.replace( route, "" ) ) )
  }
}

// 网络目录
var dirSupportType = [
  "v-fileshare", "static"
]
async function parsed( requestPath, requestUrl ){
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
        json.proxy = config.proxy || false
        // 处理文件
        var subjectConfig = await (await fetch( json.protocol + path.join( urlObject.host, "config" ) )).json()
        json.toString = () => json.string
        json.downloadContext.path = json.protocol + path.join( urlObject.host, json.downloadContext.path )
        if( parseInt( json.proxy)){
          json.downloadContext.source = json.downloadContext.path
          json.downloadContext.path = path.join( "/proxy", requestUrl )
        }
        json.download = template( fs.readFileSync( __dirname + "/../public/_down.html" ).toString(), json.downloadContext || {})
      }
      return json
    },
    "static": async function( config ) {
      // Directory
      if( (config[ "for" ] + pathdt.vpath).slice( -1 ) === "/" ) {
        var dirc = (await (await fetch( config[ "for" ] + path.join( pathdt.vpath, "directoryc" ))).text()).split( "\n" )
        var diroutput = [], readme = "", empty
        for( let file of dirc ){
          if( file.trim()[0] === "#" ) continue
          var [fileName, size] = file.split( ":" )
          var fileData = {name: fileName, isdir: false, realsize: size ? parseInt( size ) : "unknown", size: size ?fsize(parseInt( size )).human( "jedec" ) : "unknown" }
          if( fileName.slice( -1 ) === "/" ){
            fileData.isdir = true
            fileData.name = fileName.slice( 0, -1 )
          }
          diroutput.push( fileData )
          if( !readme && fileName.toLowerCase() == selfConfig.data.readme.toLowerCase() ){
            readme = await (await fetch( config[ "for" ] + fileName )).text()
          }
        }
        return {diroutput, readme, empty}
      // File
      } else {
        var file = {}
        file.download = template( fs.readFileSync( __dirname + "/../public/_down.html" ).toString(), {
          source: config.proxy ? config[ "for" ] : void 0,
          path: config.proxy ? path.join( "/proxy", requestUrl ) : config[ "for" ],
          size: "Unknown size",
          name: path.basename( requestUrl )
        })
        file.toString = () => selfConfig.page[ "no-preview" ]
        return file
      }
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