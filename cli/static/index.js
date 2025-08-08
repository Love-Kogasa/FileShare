var hash = require( "quick-hash" ),
  path = require( "path" )

main()
async function main(){
  if( !window.location.hash ) window.location.hash = "/"
  var route = window.location.hash.slice(1)
  document.write( await (await fetch( path.join( "/packet", hash( route ) ))).text())
  Array.from(document.getElementsByTagName( "a" )).forEach(( element ) => {
    if( element.href ){
      element.href = "javascript:window.open(" + JSON.stringify("#" + new URL( element.href).pathname) + ")"
    }
  })
}