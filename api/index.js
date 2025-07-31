const fastify = require( "fastify" )
const ini = require( "ini" )
const fs = require( "fs" )
const template = require( "template-string" )
const path = require( "path" )
const mimetype = require( "mimetype" )
const fsize = require( "file-size" )
const {Jimp} = require( "jimp" )
const fnet = require( "./fsurl" )
const url = require( "url" )

// 针对vercel执行路径问题
var config = ini.parse( fs.readFileSync( __dirname + "/../config.ini" ).toString() )

function pathmini( url ){
  if( url.split( "/" ).length <= 3 ) return url
  var urllist = []
  for( let part of path.dirname(url).split( "/" ) ){
    urllist.push( part[0])
  }
  return urllist.concat( path.basename( url ) ).join( "/" )
}

function getRealURL( url ){
  return path.join( "/public", path.join(config.data.files, url))
}

function getRealPath( url ){
  return path.join( __dirname + "/../public", path.join(config.data.files, url))
}

function getPath( url ){
  var filePath = getRealPath( url ), fstat = fs.statSync( filePath )
  if( fstat.isDirectory() ){
    var dir = fs.readdirSync(filePath, { withFileTypes:true })
    var diroutput = [], readme = "", empty
    dir.forEach(( v, i ) => {
      var fdata = {name: v.name, isdir: v.isDirectory(), realsize: v.size, size: fsize(v.size).human( "jedec" )}
      if( v.name.toLowerCase() == "readme.md" )
        readme = fs.readFileSync( path.join( filePath, v.name ) ).toString()
      if( path.extname( v.name ) == ".fsurl" ){
        var {subject, proxy} = fnet.parse(fs.readFileSync( path.join( filePath, v.name)).toString())
        fdata.name = path.basename(subject)
        fdata.proxy = proxy
        fdata.realname = v.name
        fdata.url = subject
      } else if( path.extname( v.name ) == ".fsdurl" ){
        fdata.realname = v.name
        fdata.name = path.basename( v.name, ".fsdurl" )
        fdata.isdir = true
      }
      diroutput[i] = fdata
    })
    if( !dir[0] ) empty = true
    return { diroutput, readme, empty }
  } else {
    var info = {}
    info.downloadContext = { name: path.basename(url), path: path.join( "/public", config.data.files, url ), size: fsize(fstat.size).human( "jedec" ), date: fstat.mtime.toString() }
    // info.download = template( fs.readFileSync( __dirname + "/../public/_down.html" ).toString(), info.downloadContext )
    info.string = config.page[ "no-perview" ]
    return info
  }
}

function render( info, $default, fullurl ){
  var out = ""
  if( Array.isArray( info.diroutput ) && info.empty !== true ){
    var dirs = [], files = []
    for( let file of info.diroutput ){
      if( file.isdir ){
        if( file.realname && path.extname( file.realname) === ".fsdurl" ){
          dirs.push( `<a class="file" href="${file.realname}/"><img src="/public/icons/folder.svg" class="file-icon" style="margin-bottom: 0px;"> <span style="display: inline-block">${file.name}/ <div class="comment">(${file.realname})</span></div></a>` )
        } else {
          dirs.push( `<a class="directory" href="${file.name}/"><img src="/public/icons/folder.svg" class="file-icon"> ${file.name}</a>` )
        }
      } else {
        var type = mimetype.lookup( file.name, false, "application/" + path.extname( file.name ) )
        if( file.realname && (path.extname( file.realname) == ".fsurl") ){
          var urlroot = url.parse( file.url )
          urlroot = urlroot.protocol + "//" + urlroot.host + "/"
          files.push( `<a class="file" href="${file.realname}"><img src="/public/icons/${file.proxy? "cursor": "globe"}.svg" class="file-icon" style="margin-bottom: 0px;background-image: url( 'https://api.freejk.com/gongju/favicon/?url=${encodeURIComponent(urlroot)}' );"> <span style="display: inline-block">${file.name} <div class="comment">(${file.realname})</span></div></a>` )
        } else if( type.includes( "image" )){
          files.push( `<a class="file" href="${file.name}"><img src="${ info.imgPreviewer ? info.protocol + path.join( info.imgPreviewer, file.name ) : "/previewer" + path.join(fullurl, file.name)}" onerror="this.src = '/public/icons/card-image.svg';this.className = 'file-icon'" class="img-file-icon"> ${file.name}</a>` )
        } else if( type.includes( "video" )){
          files.push( `<a class="file" href="${file.name}"><img src="/public/icons/file-earmark-play.svg" class="file-icon"> ${file.name}</a>` )
        } else if( type.includes( "text" ) ){
          files.push( `<a class="file" href="${file.name}"><img src="/public/icons/file-earmark-code.svg" class="file-icon"> ${file.name}</a>` )
        } else {
          files.push( `<a class="file" href="${file.name}"><img src="/public/icons/file-earmark.svg" class="file-icon"> ${file.name}</a>` )
        }
      }
    }
    out += dirs.join( "" )
    out += files.join( "" )
  }
  if( info.empty )
    out = $default
  if( !out )
    out = info.toString()
  return out
}

var app = fastify({ logger: true })
app.register( require( "@fastify/static" ), {
  root: __dirname + "/../public/",
  prefix: "/public/"
})
app.get( "/favicon.ico", ( req, reply ) => {
  reply.redirect( config.page.favicon )
})
if( config.data.domain ){
  app.get( "/sitemap.txt", ( req, reply ) => {
    var sitemap = []
    fs.readdirSync( getRealPath( "/" ), {recursive: true} ).forEach(( pathname ) => {
      sitemap.push( encodeURI(path.join( config.data.domain, pathname )) )
    })
    reply.header( "content-type", "text/plain" )
    reply.send( sitemap.join( "\n" ) )
  })
}
// 为什么不直接加在render里呢，答，render同步(
app.get( "/previewer/*", async ( req, reply ) => {
  var image = await Jimp.read( getRealPath( decodeURIComponent( req.url ).replace( "/previewer", "" ) ))
  image.resize( { w: 64, h: 64 } )
  reply.header( "content-type", "image/png")
  reply.send((await image.getBuffer( "image/png" )))
})
app.get( "/config", ( req, reply ) => {
  reply.header( "content-type", "application/json" )
  reply.send( config )
})
app.get( "/variable.css", ( req, reply ) => {
  reply.header( "content-type", "text/css" )
  reply.send( template( fs.readFileSync( __dirname + "/../public/_variable.css" ).toString(), config.page ) )
})
app.get( "/variable.js", ( req, reply ) => {
  reply.header( "content-type", "text/javascript" )
  reply.send( template( fs.readFileSync( __dirname + "/../public/_variable.js" ).toString(), {data: JSON.stringify(config.data)} ) )
})
app.get( "/fileApi/*", ( req, reply ) => {
  reply.header( "content-type", "application/json" )
  var output = getPath( decodeURIComponent(req.url.replace( "/fileApi", "" )))
  reply.send(JSON.stringify(output))
})
app.get( "/proxy/*", ( req, reply ) => {
  var url = decodeURIComponent(req.url.replace( "/proxy", "" ))
  try {
    fnet.handle( getRealPath( url ).replace( path.extname( url ), "" ), "/proxy", req, reply )
  } catch(err){
    reply.code( 500 )
    reply.send( "这里发生了一个服务端错误" )
  }
})
app.get( "/*", async ( req, reply ) => {
  var md = require( "markdown-it" )()
  var url = decodeURIComponent( req.url )
  reply.header( "content-type", "text/html" )
  var info = "", realpath = getRealPath( url ), fstat
  if( fs.existsSync( realpath ) ){
    if( (fstat = fs.statSync( realpath )).isDirectory() ){
      info = getPath( url )
      if( url !== "/" ){
        info.empty = false
        info.diroutput = [{
          name: "..",
          isdir: true
        }].concat(info.diroutput)
      }
    } else {
      info = {}
      var context = { name: path.basename(url), path: path.join( path.join( "/public", config.data.files ), req.url ), size: fsize(fstat.size).human( "jedec" ), date: fstat.mtime.toString() }
      var type = mimetype.lookup( url, false, "application/" + path.extname( url ) )
      if( type.includes( "text" ) ){
        info.toString = () => `File Preview(文件预览)<pre><code class="language-${mimetype.lookup( url, false, "application/" + path.extname( url ) ).split( "/" )[0]}">${fs.readFileSync( realpath ).toString()}</code></pre>`
      } else if( type.includes( "image" ) ){
        info.toString = () => `Image Viewer<div><img src="${getRealURL(url)}" width="90%"></div>`
      } else if( path.extname( url ) == ".fsurl" ){
        var {subject, proxy, description} = fnet.parse(fs.readFileSync( realpath ).toString())
        info.toString = () => `${description}<br>${path.basename(url)} -> ${subject}<br>文件 ${path.basename(subject)} 将会被下载到您的设备中<br>${proxy?"<font color=green>从代理获取</font>":"无代理"}`
        context.size = "Unknown Size"
        context.name = path.basename(subject)
        if( proxy ){
          context.path = path.join( "/proxy", url + path.extname( subject ) )
        } else {
          context.path = subject
        }
      } else {
        info.toString = () => config.page["no-perview"]
      }
      info.download = template( fs.readFileSync( __dirname + "/../public/_down.html" ).toString(), context )
    }
  } else {
    if( fnet.isOnlineDir( realpath ) ){
      info = await fnet.parsed( realpath )
      if( info === false ){
        info = config.page["no-file"]
        // break
      }
      if( typeof info.diroutput === "object" ){
        info.empty = false
        info.diroutput = [{
          name: "..",
          isdir: true
        }].concat(info.diroutput)
      }
    } else {
      info = config.page["no-file"]
    }
  }
  reply.send( template( fs.readFileSync( __dirname + "/../public/_index.html" ).toString(), {
    ...config.page,
    path : pathmini(url),
    "no-readme": (info.readme ? md.render(info.readme) : (info.download || md.render(config.page[ "no-readme" ]))),
    "empty-folder": render( info, config.page[ "empty-folder" ], url )
  }))
})

var serverless = async function(req, reply) {
  await app.ready()
  app.server.emit( "request", req, reply )
}
serverless.c = config
serverless.start = function( port = (process.env.PORT || 3000), callback = () => void 0 ){
  app.listen({port}, () => {
    console.log( "Server already listen on port " + port )
    callback( app )
  })
}

module.exports = serverless