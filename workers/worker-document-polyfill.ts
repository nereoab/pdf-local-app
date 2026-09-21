// Polyfill universal de document y window para Web Workers y entornos sin DOM nativo (PDF.js / pdf-lib)

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
}

const createSafeCanvas = (w = 1, h = 1) => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)));
  }
  return {
    width: Math.max(1, Math.floor(w)),
    height: Math.max(1, Math.floor(h)),
    getContext: () => ({
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: () => {},
      fillRect: () => {},
      fillText: () => {},
      measureText: () => ({ width: 0 }),
    }),
    convertToBlob: async () => new Blob([]),
  };
};

if (typeof (globalThis as any).document === 'undefined') {
  const dummyStyle: Record<string, any> = {};
  const createDummyElement = (tag = 'div') => {
    if (tag === 'canvas') {
      return createSafeCanvas(1, 1);
    }
    return {
      style: dummyStyle,
      setAttribute: () => {},
      getAttribute: () => null,
      removeAttribute: () => {},
      append: () => {},
      appendChild: () => {},
      removeChild: () => {},
      sheet: {
        cssRules: [],
        insertRule: () => 0,
        deleteRule: () => {},
      },
    };
  };

  const dummyElement = createDummyElement();

  (globalThis as any).document = {
    baseURI: typeof self !== 'undefined' && self.location ? self.location.href : '',
    documentElement: {
      getElementsByTagName: () => [dummyElement],
      style: dummyStyle,
      append: () => {},
      appendChild: () => {},
    },
    head: {
      append: () => {},
      appendChild: () => {},
    },
    body: {
      append: () => {},
      appendChild: () => {},
    },
    fonts: {
      add: () => {},
      delete: () => {},
      has: () => false,
      forEach: () => {},
      ready: Promise.resolve(),
    },
    createElement: (tag: string) => createDummyElement(tag),
    createElementNS: (_ns: string, tag: string) => createDummyElement(tag),
    getElementsByTagName: () => [dummyElement],
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

export { createSafeCanvas };
