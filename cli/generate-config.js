const fs = require( "fs" )
const {getRealPath} = require( "../api/config" )
const mime = require( "mimetype" )
const path = require( "path" )

var fileDir = getRealPath("/")
var filePaths = fs.readdirSync(fileDir, {recursive: true})
var previewPaths = []
filePaths.forEach(( fileName ) => {
  if( mime.lookup( fileName, false, "application/unknown" ).includes( "image/" ) ){
    previewPaths.push( path.join( "previewer", fileName ) )
  }
})


module.exports = {

  // 基于工作目录
  output: "./dist",
  
  // 构建占用的端口
  port: 2333,
  
  // 需要构建的路径列表
  requestRoute: [
    "/",
    ...filePaths
  ],
  
  // 直接按原路径输出的路径列表
  requestRouteStatic: [
    ...previewPaths, // 小图标预览，因为目录不可能是图标，所以选择直接按目录输出
    "sitemap.txt",
    "config",
    "variable.css",
    "favicon.ico"
  ]
  
}