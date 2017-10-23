// @flow
type File = {
  opts: {
    filename: string,
  },
  metadata: {
    modules: {
      imports: {
        find: Function,
      },
    },
  },
}

export type State = {
  file: File,
  opts: {
    idHash?: string,
  },
}
