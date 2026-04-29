const { generateUUID, buildUrl, encodeClientCredentials, handleAxiosError } = require('../../src/utils/helpers');

describe('generateUUID', () => {
  test('returns a valid UUID v4 format string', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test('successive calls produce unique values', () => {
    expect(generateUUID()).not.toBe(generateUUID());
  });
});

describe('buildUrl', () => {
  test('appends query params to base URL', () => {
    const result = buildUrl('https://example.com', { a: '1', b: '2' });
    expect(result).toContain('a=1');
    expect(result).toContain('b=2');
  });

  test('preserves existing query params on base URL', () => {
    const result = buildUrl('https://example.com?foo=bar', { baz: 'qux' });
    expect(result).toContain('foo=bar');
    expect(result).toContain('baz=qux');
  });

  test('appends hash when provided', () => {
    const result = buildUrl('https://example.com', {}, 'section1');
    expect(result).toContain('#section1');
  });

  test('returns a valid URL string', () => {
    const result = buildUrl('https://example.com/path', { key: 'val' });
    expect(result).toMatch(/^https:\/\/example\.com\/path\?/);
  });
});

describe('encodeClientCredentials', () => {
  test('base64-encodes id:secret separated by a literal colon', () => {
    const result = encodeClientCredentials('myid', 'mysecret');
    const decoded = Buffer.from(result, 'base64').toString();
    expect(decoded).toBe('myid:mysecret');
  });

  test('URL-encodes special characters within id and secret individually', () => {
    // encodeURIComponent is applied to each side; the separator colon stays literal
    const result = encodeClientCredentials('a:b', 'c:d');
    const decoded = Buffer.from(result, 'base64').toString();
    expect(decoded).toBe('a%3Ab:c%3Ad');
  });
});

describe('handleAxiosError', () => {
  let res;

  beforeEach(() => {
    res = { render: jest.fn() };
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders error view with generic message when response present', () => {
    const error = {
      message: 'Request failed',
      response: { data: { message: 'invalid_grant' } }
    };
    handleAxiosError(error, res, 'TokenExchange');
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({
      error: 'TokenExchange failed. Please try again.'
    }));
  });

  test('renders error view with generic message when no response', () => {
    const error = { message: 'Network Error' };
    handleAxiosError(error, res, 'TokenExchange');
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({
      error: 'TokenExchange failed. Please try again.'
    }));
  });

  test('uses default context label when not provided', () => {
    const error = { message: 'oops' };
    handleAxiosError(error, res);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({
      error: expect.stringContaining('Request')
    }));
  });
});
