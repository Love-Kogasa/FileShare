const fastify = require( "fastify" )
const ini = require( "ini" )
const fs = require( "fs" )
const template = require( "template-string" )
const path = require( "path" )
const mimetype = require( "mimetype" )
const fsize = require( "file-size" )
const fnet = require( "./fsurl" )
const url = require( "url" )

var {config, getRealURL, getRealPath, pathmini} = require( "./config" )
var {getPathData: getPath, renderFileList: render} = require( "./api" )

var app = fastify({ logger: true })
app.register(require( "@fastify/static" ), {
  root: __dirname + "/../public/",
  prefix: "/public/"
})

app.get("/favicon.ico", ( req, reply ) => { reply.redirect( config.page.favicon ) })
if( config.data.domain ) app.get("/sitemap.txt", require("./routes/sitemap"))
app.get("/previewer/*", require("./routes/previewer"))
app.get("/config", require("./routes/config"))
app.get("/proxy/*", require("./routes/proxy"))
app.get("/fileApi/*", require("./routes/fileApi"))
app.get( "/variable.css", ( req, reply ) => {
  reply.header( "content-type", "text/css" )
  reply.send( template( fs.readFileSync( __dirname + "/../public/_variable.css" ).toString(), config.page ) )
})

app.get( "/*", async ( req, reply ) => {
  var md = require( "markdown-it" )()
  var urlm = require( "url" )
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
      var context = { name: path.basename(url), path: path.join( "/public", config.data.files, req.url ), size: fsize(fstat.size).human( "jedec" ), date: fstat.mtime.toString() }
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
          context.path = path.join( "/proxy", url )
        } else {
          context.path = subject
        }
      } else if( path.extname( url ) == ".fsurls" ) {
        var {fileName, urls} = fnet.parseUrls(fs.readFileSync( realpath ).toString(), url)
        context.path = urls
        context.size = "Unknown Size"
        context.name = fileName
        info.toString = () => config.page["no-preview"]
      } else {
        info.toString = () => config.page["no-preview"]
      }
      context.path = JSON.stringify( context.path)
      info.download = template( fs.readFileSync( __dirname + "/../public/_down.html" ).toString(), context )
    }
  } else {
    if( fnet.isOnlineDir( realpath ) ){
      info = await fnet.parsed( realpath, req.url )
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
  var linksRender = ""
  for( let line in config.footer ){
    var link = config.footer[line]
    var urlroot = urlm.parse( link )
    urlroot = urlroot.protocol + "//" + urlroot.host + "/"
    linksRender += `<a href=${link}><img src="https://www.favicon.vip/get.php?url=${encodeURIComponent(urlroot)}" class="link-icon" alt="${line}"></a>`
  }
  var menuRender = ""
  for( let line in config.menu ){
    var link = config.menu[line]
    var urlroot = urlm.parse( link )
    urlroot = urlroot.protocol + "//" + urlroot.host + "/"
    menuRender += `<div style="margin-top: 0.7ch;"><a href=${link}><img src="https://www.favicon.vip/get.php?url=${encodeURIComponent(urlroot)}" class="icon" alt="${line}"></a></div>`
  }
  var sakanaWidgetRender = ""
  if( parseInt(config[ "sakana-widget" ].enable) ){
    var customCharacter = ( img ) => `const custom = SakanaWidget.getCharacter( "chisato" )
    custom.image = ${JSON.stringify( img )}
    SakanaWidget.registerCharacter( "custom", custom" )`
    sakanaWidgetRender = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sakana-widget@2.7.1/lib/sakana.min.css" />
    <script>
    function initSakanaWidget(){
      ${ config[ "sakana-widget" ].img ? customCharacter( config[ "sakana-widget" ].img ) : "" }
      new SakanaWidget({ character : ${JSON.stringify( config[ "sakana-widget" ].character)}}).mount( "#sakana-widget" )
    } </script>
    <script async onload="initSakanaWidget()" src="https://cdn.jsdelivr.net/npm/sakana-widget@2.7.1/lib/sakana.min.js"></script>`
  }
  reply.send( template( fs.readFileSync( __dirname + "/../public/_index.html" ).toString(), {
    ...config.page,
    path : pathmini(url),
    "no-readme": (
      (info.readme && typeof info.readme) == "string" ?
        md.render(info.readme) :
        typeof info.readme == "function" ?
          md.render( await info.readme() ) : (info.download || md.render(config.page[ "no-readme" ]))
      ),
    "empty-folder": render( info, config.page[ "empty-folder" ], url ),
    "links-render": linksRender,
    "menu-render": menuRender,
    "sakana-widget-render": sakanaWidgetRender
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