import supercluster from 'supercluster';

export const Supercluster = supercluster;

export const Rendered = (() => {
  let rendered = [];

  return {
    get: () => rendered,
    set: (r) => {
      rendered = r;
    }
  }
})()
