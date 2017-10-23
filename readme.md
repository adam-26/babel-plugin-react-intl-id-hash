# babel-plugin-react-intl-id-hash

> react-intl `id` values as short consistent hash values, reduce translation file size!

This babel-plugin uses the murmur3 hash to generate short consistent message `id` values.

```json

```

### Before

```js
import { defineMessages } from 'react-intl'

export default defineMessages({
  hello: {
    id: 'App.Components.Greeting.hello',
    defaultMessage: 'hello {name}'
  }
})
```

### After

With babel-plugin-react-intl-id-hash.

```js
import { defineMessages } from 'react-intl'

export default defineMessages({
  hello: {
    id: 'GSplhw==',
    defaultMessage: 'hello {name}'
  }
})
```

## Install

npm

```
$ npm install --save-dev babel-plugin-react-intl-id-hash
```

yarn

```
$ yarn add --dev babel-plugin-react-intl-id-hash
```

## Usage

.babelrc

```json
{
  "plugins": [
    "react-intl-id-hash"
  ]
}
```

This can be used with the [babel-plugin-react-intl](https://github.com/yahoo/babel-plugin-react-intl).

Another good alternative is [babel-plugin-react-intl-auto](https://github.com/akameco/babel-plugin-react-intl-auto), which **must run before** this plugin.

.bablerc

```json
{
  "plugins": [
    ["react-intl-auto", {
      "removePrefix": true,
      "includeExportName": true
    }],
    "react-intl-id-hash"
  ]
}
```

### Options

#### idHash

The name of the hash to be used for generating id values

Type: `string` <br>
Default: `murmur3`

currently, only `murmur3` is supported

## License

MIT
