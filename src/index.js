// @flow
import * as t from 'babel-types'
import type { State } from './types'
import murmur3Hash from './murmurHash'

const isImportLocalName = (
  name: string,
  allowedNames: $ReadOnlyArray<string>,
  { file }: State
) => {
  const isSearchedImportSpecifier = specifier =>
    specifier.isImportSpecifier() &&
    allowedNames.includes(specifier.node.imported.name) &&
    specifier.node.local.name === name

  let isImported = false

  file.path.traverse({
    ImportDeclaration: {
      exit(path) {
        isImported =
          path.node.source.value === 'react-intl' &&
          path.get('specifiers').some(isSearchedImportSpecifier)

        if (isImported) {
          path.stop()
        }
      },
    },
  })

  return isImported
}

const isIdProp = prop => {
  const path = prop.get('key')
  return (path.isStringLiteral() ? path.node.value : path.node.name) === 'id'
}

const getMessageId = objectProperty => {
  if (!objectProperty.isObjectExpression()) {
    return
  }

  const objProps = objectProperty.get('properties')
  for (let i = 0, len = objProps.length; i < len; i++) {
    objectProperty = objProps[i]

    if (isIdProp(objectProperty)) {
      const propValue = objectProperty.get('value')
      if (propValue.isStringLiteral()) {
        // eslint-disable-next-line consistent-return
        return propValue.node.value
      }

      // if id is not a string value, nothing can be done
      break
    }
  }
}

const createIdHash = (id, hashName) => {
  switch (hashName) {
    case 'murmur3':
      return murmur3Hash(id)
    default:
      throw new Error(`unsupported idHash '${hashName}'`)
  }
}

const isReactIntlImport = (path: Object, state: State): boolean => {
  const callee = path.get('callee')
  if (!callee.isIdentifier()) {
    return false
  }

  if (!isImportLocalName(callee.node.name, ['defineMessages'], state)) {
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
      const messageId = getMessageId(objProp)
      if (typeof messageId === 'undefined') {
        // these is no valid messageId value to hash
        // eslint-disable-next-line no-continue
        continue
      }

      const id = createIdHash(messageId, idHash)

      objProp.replaceWith(
        t.objectExpression([
          t.objectProperty(t.stringLiteral('id'), t.stringLiteral(id)),
          ...objProp
            .get('properties')
            .filter(v => !isIdProp(v))
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
        if (!isReactIntlImport(path, state)) {
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
