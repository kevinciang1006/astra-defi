import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for viem compatibility in jsdom
import { TextEncoder, TextDecoder } from 'util';
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}
