const fs = require( "fs" ),
  path = require( "path" ),
  mimetype = require( "mimetype" ),
  fsize = require( "file-size" ),
  fnet = require( "./fsurl" ),
  url = require( "url" )

var {config, getRealPath} = require( "./config" )

function getPathData( url ) {
  var filePath = getRealPath( url ), fstat = fs.statSync( filePath )
  if( fstat.isDirectory() ){
    var dir = fs.readdirSync(filePath, { withFileTypes:true })
    var diroutput = [], readme = "", empty
    dir.forEach(( v, i ) => {
      var fdata = {name: v.name, isdir: v.isDirectory(), realsize: v.size, size: fsize(v.size).human( "jedec" )}
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
      } else if( path.extname( v.name ) == ".fsurls" ) {
        fdata.realname = v.name
        fdata.name = fs.readFileSync( path.join( filePath, v.name)).toString().split( "\n" )[0]
      }
      if( !readme && fdata.name.toLowerCase() == config.data.readme ){
        if( fdata.realname ){
          readme = async () => await (await fetch(fnet.parse( fs.readFileSync(path.join( filePath, v.name)).toString()).subject)).text()
        } else {
          readme = fs.readFileSync( path.join( filePath, v.name ) ).toString()
        }
      }
      diroutput[i] = fdata
    })
    if( !dir[0] ) empty = true
    return { diroutput, readme, empty }
  } else {
    var info = {}
    info.downloadContext = { name: path.basename(url), path: JSON.stringify(path.join( "/public", config.data.files, url )), size: fsize(fstat.size).human( "jedec" ), date: fstat.mtime.toString() }
    info.string = config.page[ "no-preview" ]
    return info
  }
}

function renderFileList( info, $default, fullurl ) {
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
          files.push( `<a class="file" href="${file.realname}"><img src="/public/icons/${file.proxy? "cursor": "globe"}.svg" class="file-icon" style="margin-bottom: 0px;background-image: url( 'https://www.favicon.vip/get.php?url=${encodeURIComponent(urlroot)}' );"> <span style="display: inline-block">${file.name} <div class="comment">(${file.realname})</span></div></a>` )
        } else if( file.realname && (path.extname( file.realname) == ".fsurls") ){
          files.push( `<a class="file" href="${file.realname}"><img src="/public/icons/file-earmark.svg" class="file-icon" style="margin-bottom: 0px;"> <span style="display: inline-block">${file.name} <div class="comment">(${file.realname})</span></div></a>` )
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

module.exports = {getPathData, renderFileList}
