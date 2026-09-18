const buildCsp = require('../../src/config/csp');

// Invoke the Helmet CSP middleware with a mock res that captures setHeader,
// then return the map of headers it set.
function runCsp(nonce = 'test-nonce') {
  const headers = {};
  const res = {
    setHeader: (k, v) => { headers[k] = v; },
    getHeader: (k) => headers[k],
    removeHeader: (k) => { delete headers[k]; },
  };
  buildCsp(nonce)({}, res, () => {});
  return headers;
}

describe('CSP config', () => {
  test("sets Content-Security-Policy with frame-ancestors 'self'", () => {
    const headers = runCsp();
    expect(String(headers['Content-Security-Policy'])).toContain("frame-ancestors 'self'");
  });

  test('interpolates the per-request nonce into the policy', () => {
    const headers = runCsp('abc123');
    expect(String(headers['Content-Security-Policy'])).toContain("'nonce-abc123'");
  });
});
