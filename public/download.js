streamSaver.mtlm = "https://cdn.jsdelivr.net/npm/streamsaver@2.0.6/mitm.html"

async function download( subject, link ) {
  if( Array.isArray( subject ) ) {
    var stream = streamSaver.createWriteStream( link.download )
    var writer = stream.getWriter()
    for( let url of subject ){
      var reader = (await fetch( url )).body.getReader()
      let read = async () => {
        var {value, done} = await reader.read()
        if( done ) return;
        writer.write( value )
        await read()
      }
      await read()
    }
    writer.close()
  } else if( typeof subject === "string" ) {
    link.href = subject
    link.click()
  } else {
    throw new TypeError( "未知下载类型！" )
  }
}