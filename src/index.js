// @flow
import * as t from 'babel-types'
import murmurhashJs from 'murmurhash-js'
import type { State } from './types'

const PKG_NAME = 'react-intl'
const FUNC_NAME = 'defineMessages'

const isImportLocalName = (name: string, { file }: State) => {
  const imports = file.metadata.modules.imports
  const intlImports = imports.find(x => x.source === PKG_NAME)
  if (intlImports) {
    const specifier = intlImports.specifiers.find(x => x.imported === FUNC_NAME)
    if (specifier) {
      return specifier.local === name
    }
  }

  return false
}

// https://stackoverflow.com/questions/15761790/convert-a-32bit-integer-into-4-bytes-of-data-in-javascript
function toBytesInt32(num) {
  const arr = new ArrayBuffer(4)
  const view = new DataView(arr)
  view.setUint32(0, num, false)
  return arr
}

function murmur3Hash(id) {
  return Buffer.from(toBytesInt32(murmurhashJs(id))).toString('base64')
}

const getId = (path, hashName) => {
  let name

  if (path.isStringLiteral()) {
    name = path.node.value
  } else if (path.isIdentifier()) {
    name = path.node.name
  }

  if (!name) {
    throw new Error(`requires Object key or string literal`)
  }

  switch (hashName) {
    case 'murmur3':
      return murmur3Hash(name)
    default:
      throw new Error(`unsupported idHash '${hashName}'`)
  }
}

const isValidate = (path: Object, state: State): boolean => {
  const callee = path.get('callee')
  if (!callee.isIdentifier()) {
    return false
  }

  if (!isImportLocalName(callee.node.name, state)) {
    return false
  }

  const messagesObj = path.get('arguments')[0]
  if (!messagesObj) {
    return false
  }

  if (!(messagesObj.isObjectExpression() || messagesObj.isIdentifier())) {
    return false
  }

  return true
}

const replaceProperties = (properties: Object[], state: State) => {
  const { idHash = 'murmur3' } = state.opts

  for (const prop of properties) {
    const objProp = prop.get('value')

    // { defaultMessage: 'hello', description: 'this is hello' }
    if (objProp.isObjectExpression()) {
      const objProps = objProp.get('properties')

      // { id: 'already has id', defaultMessage: 'hello' }
      const notHasId = objProps.every(v => v.get('key').node.name !== 'id')
      if (notHasId) {
        continue // eslint-disable-line
      }

      const id = getId(prop.get('key'), idHash)

      objProp.replaceWith(
        t.objectExpression([
          t.objectProperty(t.stringLiteral('id'), t.stringLiteral(id)),
          ...objProps
            .filter(v => v.get('key').node.name !== 'id')
            .map(v => v.node),
        ])
      )
    }
  }
}

export default function() {
  return {
    name: 'react-intl-id-hash',
    visitor: {
      CallExpression(path: Object, state: State) {
        if (!isValidate(path, state)) {
          return
        }
        const messagesObj = path.get('arguments')[0]
        let properties

        if (messagesObj.isObjectExpression()) {
          properties = messagesObj.get('properties')
        } else if (messagesObj.isIdentifier()) {
          const name = messagesObj.node.name
          const obj = messagesObj.scope.getBinding(name)
          if (!obj) {
            return
          }
          properties = obj.path.get('init').get('properties')
        }

        if (properties) {
          replaceProperties(properties, state)
        }
      },
    },
  }
}
