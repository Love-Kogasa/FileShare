const hash = require( "quick-hash" )
const config = require( "./generate-config" )
const fs = require( "fs" )
const server = require( "../api/index" )
const path = require( "path" )
const http = require( "http" )

main()

function main() {
  log( "静态文件开始构建，这可能需要浪费一段时间" )
  var publicDirectory = path.join( __dirname, "../public/" )
  log( "正在检查输出目录" )
  fs.cpSync( path.join( __dirname, "static"), config.output, {recursive: true} )
  log( "正在复制静态资源目录" )
  fs.cpSync( publicDirectory, path.join( config.output, "/public/" ), {recursive: true})
  log( "正在启动构建服务器" )
  server.start( config.port, async ( app ) => {
    log( "正在从服务器获取结果文件" )
    for( let route of config.requestRouteStatic ){
      route = path.join( "/", route );
      (await get( route )).pipe( write( path.join( config.output, route )))
    }
    for( let route of config.requestRoute ){
      route = path.join( "/", route );
      console.log(route, hash(route));
      (await get( route )).pipe( write( path.join( config.output, "packet", hash( route ))))
    }
    log( "静态文件生成完毕，正在关闭构建服务器" )
    app.close()
  })
}

function write( filePath ) {
  fs.mkdirSync( path.dirname( filePath ), {recursive: true} )
  return fs.createWriteStream( filePath )
}

function get( route ) {
  return new Promise(( res, rej ) => {
    http.get( "http://localhost:" + config.port + route, ( response ) => {
      if( response.headers.location ){
        // 处理favicon一类的东西
        get( response.headers.location ).then( res ).catch( rej )
      } else {
        res( response )
      }
    }).on( "error", rej )
  })
}

function log( text, type = "INFO" ) {
  console.log( `[${type}] ${text}` )
}