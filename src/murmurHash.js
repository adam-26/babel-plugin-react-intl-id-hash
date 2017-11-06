// @flow
import murmurhashJs from 'murmurhash-js'

// https://stackoverflow.com/questions/15761790/convert-a-32bit-integer-into-4-bytes-of-data-in-javascript
function toBytesInt32(num: number) {
  const arr = new ArrayBuffer(4)
  const view = new DataView(arr)
  view.setUint32(0, num, false)
  return arr
}

function murmur3Hash(id: string) {
  return Buffer.from(toBytesInt32(murmurhashJs(id))).toString('base64')
}

export default murmur3Hash
