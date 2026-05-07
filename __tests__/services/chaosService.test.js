jest.mock('axios');

const axios = require('axios');
const chaosService = require('../../src/services/chaosService');

beforeEach(() => jest.clearAllMocks());

describe('runProbes', () => {
  const TOKEN = 'test_token';
  const INSTANCE = 'https://example.my.salesforce.com';

  test('fires exactly 6 probes', async () => {
    axios.post.mockResolvedValue({ status: 201, data: { id: 'acc1', success: true } });
    const results = await chaosService.runProbes(TOKEN, INSTANCE);
    expect(results).toHaveLength(6);
  });

  test('each probe has label, status, body, ms, and passed fields', async () => {
    axios.post.mockResolvedValue({ status: 201, data: {} });
    const results = await chaosService.runProbes(TOKEN, INSTANCE);
    results.forEach(r => {
      expect(r).toHaveProperty('label');
      expect(r).toHaveProperty('status');
      expect(r).toHaveProperty('body');
      expect(r).toHaveProperty('ms');
      expect(r).toHaveProperty('passed');
    });
  });

  test('passed is true when axios resolves', async () => {
    axios.post.mockResolvedValue({ status: 201, data: { id: 'x' } });
    const results = await chaosService.runProbes(TOKEN, INSTANCE);
    results.forEach(r => expect(r.passed).toBe(true));
  });

  test('passed is false and status comes from error response when axios rejects', async () => {
    const errResponse = { response: { status: 400, data: [{ errorCode: 'REQUIRED_FIELD_MISSING' }] } };
    axios.post.mockRejectedValue(errResponse);
    const results = await chaosService.runProbes(TOKEN, INSTANCE);
    results.forEach(r => {
      expect(r.passed).toBe(false);
      expect(r.status).toBe(400);
    });
  });

  test('uses ERR status and message body when no http response is present', async () => {
    axios.post.mockRejectedValue(new Error('network failure'));
    const results = await chaosService.runProbes(TOKEN, INSTANCE);
    results.forEach(r => {
      expect(r.status).toBe('ERR');
      expect(r.body).toEqual({ message: 'network failure' });
    });
  });

  test('sends Bearer auth header on every probe', async () => {
    axios.post.mockResolvedValue({ status: 201, data: {} });
    await chaosService.runProbes(TOKEN, INSTANCE);
    axios.post.mock.calls.forEach(([, , config]) => {
      expect(config.headers.Authorization).toBe('Bearer ' + TOKEN);
    });
  });

  test('targets the provided instanceUrl', async () => {
    axios.post.mockResolvedValue({ status: 201, data: {} });
    await chaosService.runProbes(TOKEN, INSTANCE);
    axios.post.mock.calls.forEach(([url]) => {
      expect(url).toContain(INSTANCE);
    });
  });

  test('all probes target the Account sobject endpoint', async () => {
    axios.post.mockResolvedValue({ status: 201, data: {} });
    await chaosService.runProbes(TOKEN, INSTANCE);
    axios.post.mock.calls.forEach(([url]) => {
      expect(url).toContain('/sobjects/Account');
    });
  });
});
