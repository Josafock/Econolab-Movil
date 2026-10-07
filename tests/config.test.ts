import { validateApiUrl } from '../src/core/config';

describe('API configuration', () => {
  it('normalizes an HTTPS endpoint', () => expect(validateApiUrl('https://example.test/api/')).toBe('https://example.test/api'));
  it('requires configuration', () => expect(() => validateApiUrl('')).toThrow());
  it('rejects credential-bearing URLs and insecure published URLs', () => {
    expect(() => validateApiUrl('https://user:secret@example.test/api')).toThrow();
    expect(() => validateApiUrl('http://example.test/api')).toThrow();
  });
  it('allows HTTP only for a development environment', () => expect(validateApiUrl('http://localhost:3000/api', true)).toBe('http://localhost:3000/api'));
});
