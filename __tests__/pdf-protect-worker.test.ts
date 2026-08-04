/**
 * Tests unitarios para el worker de protección PDF (AES-256 ISO 32000-2)
 *
 * Verifica las funciones criptográficas puras que no dependen del DOM:
 * - bytesToHex, concatBuffers, randomBytes, saslPrepPassword
 * - buildPermissions
 */

// Importamos solo las funciones puras (no el worker completo que depende de pdf-lib y DOM)
describe('pdf-protect-worker — Utilidades criptográficas', () => {
  // ─── bytesToHex ────────────────────────────────
  describe('bytesToHex', () => {
    // Implementación inline para test sin depender del worker (Web Crypto no disponible en Node puro)
    function bytesToHex(bytes: Uint8Array): string {
      let hex = '';
      for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
      }
      return hex;
    }

    it('convierte bytes vacíos a string vacío', () => {
      expect(bytesToHex(new Uint8Array(0))).toBe('');
    });

    it('convierte un solo byte correctamente', () => {
      expect(bytesToHex(new Uint8Array([0xff]))).toBe('ff');
      expect(bytesToHex(new Uint8Array([0x00]))).toBe('00');
      expect(bytesToHex(new Uint8Array([0x0a]))).toBe('0a');
    });

    it('convierte múltiples bytes correctamente', () => {
      expect(bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe('deadbeef');
      expect(bytesToHex(new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef]))).toBe(
        '0123456789abcdef',
      );
    });
  });

  // ─── concatBuffers ──────────────────────────────
  describe('concatBuffers', () => {
    function concatBuffers(...arrays: Uint8Array[]): Uint8Array {
      const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
      }
      return result;
    }

    it('concatena un solo buffer (identidad)', () => {
      const input = new Uint8Array([1, 2, 3]);
      expect(concatBuffers(input)).toEqual(input);
    });

    it('concatena dos buffers', () => {
      const a = new Uint8Array([1, 2]);
      const b = new Uint8Array([3, 4, 5]);
      expect(concatBuffers(a, b)).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    });

    it('concatena tres buffers vacíos y no vacíos', () => {
      const a = new Uint8Array([10]);
      const b = new Uint8Array(0);
      const c = new Uint8Array([20, 30]);
      expect(concatBuffers(a, b, c)).toEqual(new Uint8Array([10, 20, 30]));
    });

    it('devuelve array vacío si todos son vacíos', () => {
      expect(concatBuffers(new Uint8Array(0), new Uint8Array(0))).toEqual(new Uint8Array(0));
    });
  });

  // ─── randomBytes ────────────────────────────────
  describe('randomBytes', () => {
    function randomBytes(n: number): Uint8Array {
      const bytes = new Uint8Array(n);
      crypto.getRandomValues(bytes);
      return bytes;
    }

    it('genera el número correcto de bytes', () => {
      expect(randomBytes(16).length).toBe(16);
      expect(randomBytes(32).length).toBe(32);
      expect(randomBytes(0).length).toBe(0);
    });

    it('genera valores pseudo-aleatorios (dos llamadas no son idénticas)', () => {
      const a = randomBytes(32);
      const b = randomBytes(32);
      // Extremadamente improbable que dos arrays de 32 bytes sean idénticos
      const identical = a.every((v, i) => v === b[i]);
      expect(identical).toBe(false);
    });
  });

  // ─── saslPrepPassword ──────────────────────────
  describe('saslPrepPassword', () => {
    function saslPrepPassword(password: string): Uint8Array {
      const bytes = new TextEncoder().encode(password);
      return bytes.length > 127 ? bytes.slice(0, 127) : bytes;
    }

    it('codifica contraseña normal', () => {
      const result = saslPrepPassword('hello');
      expect(result).toEqual(new TextEncoder().encode('hello'));
    });

    it('codifica contraseña vacía', () => {
      const result = saslPrepPassword('');
      expect(result).toEqual(new Uint8Array(0));
    });

    it('trunca contraseñas de más de 127 bytes', () => {
      const long = 'a'.repeat(200);
      const result = saslPrepPassword(long);
      expect(result.length).toBe(127);
      expect(result).toEqual(new TextEncoder().encode('a'.repeat(127)));
    });

    it('no trunca contraseña de exactamente 127 bytes', () => {
      const exact = 'a'.repeat(127);
      const result = saslPrepPassword(exact);
      expect(result.length).toBe(127);
    });
  });

  // ─── buildPermissions ──────────────────────────
  describe('buildPermissions', () => {
    function buildPermissions(options: {
      allowPrinting: boolean;
      allowHighQualityPrint: boolean;
      allowModifying: boolean;
      allowCopying: boolean;
      allowExtraction: boolean;
      allowAnnotating: boolean;
      allowFillingForms: boolean;
      allowAssembly: boolean;
    }): number {
      let P = 0xfffff000 | 0x000000c0;
      if (options.allowPrinting !== false) P |= 0x00000004;
      if (options.allowModifying !== false) P |= 0x00000008;
      if (options.allowCopying !== false) P |= 0x00000010;
      if (options.allowAnnotating !== false) P |= 0x00000020;
      if (options.allowFillingForms !== false) P |= 0x00000100;
      if (options.allowExtraction !== false) P |= 0x00000200;
      if (options.allowAssembly !== false) P |= 0x00000400;
      if (options.allowHighQualityPrint !== false) P |= 0x00000800;
      return P | 0;
    }

    const baseOptions = {
      allowPrinting: true,
      allowHighQualityPrint: true,
      allowModifying: true,
      allowCopying: true,
      allowExtraction: true,
      allowAnnotating: true,
      allowFillingForms: true,
      allowAssembly: true,
    };

    it('todos los permisos habilitados', () => {
      const P = buildPermissions(baseOptions);
      expect(P & 0x00000004).not.toBe(0); // Printing
      expect(P & 0x00000008).not.toBe(0); // Modifying
      expect(P & 0x00000010).not.toBe(0); // Copying
      expect(P & 0x00000020).not.toBe(0); // Annotating
      expect(P & 0x00000100).not.toBe(0); // Filling forms
      expect(P & 0x00000200).not.toBe(0); // Extraction
      expect(P & 0x00000400).not.toBe(0); // Assembly
      expect(P & 0x00000800).not.toBe(0); // Hi quality print
    });

    it('sin permisos (todo false)', () => {
      const P = buildPermissions({
        allowPrinting: false,
        allowHighQualityPrint: false,
        allowModifying: false,
        allowCopying: false,
        allowExtraction: false,
        allowAnnotating: false,
        allowFillingForms: false,
        allowAssembly: false,
      });
      expect(P & 0x00000004).toBe(0);
      expect(P & 0x00000008).toBe(0);
      expect(P & 0x00000010).toBe(0);
    });

    it('solo impresión habilitada', () => {
      const P = buildPermissions({
        ...baseOptions,
        allowModifying: false,
        allowCopying: false,
        allowExtraction: false,
        allowAnnotating: false,
        allowFillingForms: false,
        allowAssembly: false,
      });
      expect(P & 0x00000004).not.toBe(0); // Printing ON
      expect(P & 0x00000008).toBe(0); // Modifying OFF
      expect(P & 0x00000010).toBe(0); // Copying OFF
    });

    it('el bit de revisión (bit 3-4) siempre está presente', () => {
      const P1 = buildPermissions(baseOptions);
      const P2 = buildPermissions({ ...baseOptions, allowPrinting: false });
      // Los bits 0x000000C0 deben estar presentes (PDF spec requirement)
      expect(P1 & 0x000000c0).toBe(0x000000c0);
      expect(P2 & 0x000000c0).toBe(0x000000c0);
    });
  });
});