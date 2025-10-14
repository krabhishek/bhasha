/**
 * Test setup file for vitest
 * Configures the test environment to support TypeScript 5.0+ Stage 3 decorators
 */

// Polyfill Symbol.metadata for TypeScript 5.0+ Stage 3 decorators
// This is needed because Node.js doesn't natively support Symbol.metadata yet
if (!(Symbol as any).metadata) {
  (Symbol as any).metadata = Symbol('Symbol.metadata');
}

// Export empty object to make this a module
export {};
