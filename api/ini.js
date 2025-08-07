var escapeTable = {
  "\\": "\\",
  "n": "\n",
  "t": "\t",
  "#": "#"
}

function decode( codes ) {
  var object = {}, key = "", _lastParse = {done: true}
  for( let line of codes.split( "\n" ) ) {
    line = line.trim()
    if( isComment( line ) ) continue;
    if( isKey( line ) && _lastParse.done ) {
      key = line.slice( 1, -1 )
      object[key] = {}
    } else {
      if( !_lastParse.done ) {
        _lastParse.done = valueIsDone( line )
        if( key ) {
          object[key][_lastParse.key] += "\n" + line
        } else {
          object[_lastParse.key] += "\n" + line
        }
      } else {
        _lastParse = parseKv( line )
        if( !_lastParse.key ){
          if( !Array.isArray( object[key] ) ) object[key] = []
          _lastParse.key = object[key].length
        }
        if( key ) {
          object[key][_lastParse.key] = _lastParse.value
        } else {
          object[_lastParse.key] = _lastParse.value
        }
      }
    }
  }
  delete _lastParse
  return object
  function isComment( string ) {
    return string === "" || ["#", ";"].includes( string[0] )
  }
  function isKey( string ) {
    return (string[0] === "[" && string.slice(-1) === "]")
  }
  function parseKv( code ) {
    var [key, ...value] = code.split( "=" ), _result
    value = value.join( "=" ).trim()
    var done = valueIsDone( value );
    (typeof (_result = parseBoolean( value )) === "boolean" ||
      typeof (_result = parseNumber( value )) === "number" ||
      (_result = parseVoidAndNull( value )) !== false ||
      (_result = escapeString( value )))
    value = _result
    if( !done ) value = value.slice( 0, -1 )
    return {
      key: key.trim(), value, done
    }
  }
  function parseVoidAndNull( value ) {
    if( value === "void" ) return void 0
    if( value === "null" ) return null
    return false
  }
  function parseBoolean( value ) {
    if( value === "true" ) return true
    if( value === "false" ) return false
  }
  function parseNumber( value ) {
    if( !Number.isNaN( Number( value ) ) ) {
      return Number( value )
    } else if( value === "NaN" ) {
      return NaN
    }
  }
  function escapeString( value ) {
    if( value.includes( " #" ) )
      value = value.slice( 0, value.indexOf( " #" ) )
    for( let key in escapeTable ) {
      value = value.replaceAll( "\\" + key, escapeTable[key] )
    }
    return value
  }
  function valueIsDone( value ) {
    return value.slice( -1 ) !== "\\"
  }
}

// console.log(decode(require("fs").readFileSync("x.ini").toString()))

function encode( object ) {
  var lines = []
  for( let key in object ) {
    if( typeof object[key] !== "object" || object[key] === null ) {
      let value = parseString( object[key] )
      for( let char in escapeTable ) {
        value = value.replaceAll( escapeTable[char], "\\" + char )
      }
      if( Array.isArray( object ) ) {
        lines.push( "=\t" + value )
      } else {
        lines.push( key + "\t=\t" + value )
      }
    } else {
      lines.push( "\n[" + key + "]" )
      lines.push( encode( object[key] ) )
    }
  }
  return lines.join( "\n" )
  function parseString( value ) {
    if( value === null ) return "null"
    if( value === void 0 ) return "void"
    return value.toString()
  }
}

/*console.log(encode({
  hello: "World", object: {
    key: 1, bool: false,
    "null": null,
    "114514": "114514\n1919810"
  }, array: [ 1,2,3]
}))*/
if( typeof module === "object" ){
  module.exports = {
    encode, decode,
    parse: decode,
    stringify: encode,
    safe: () => void 0,
    unsafe: () => void 0
  }
} else {
  var xini = {
    encode, decode,
    parse: decode,
    stringify: encode,
    safe: () => void 0,
    unsafe: () => void 0
  }
}