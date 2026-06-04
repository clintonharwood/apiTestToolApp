jest.mock('axios');

const axios = require('axios');
const sfService = require('../../src/services/salesforceService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getTokenAuthCode', () => {
  const clientConfig = { client_id: 'clientId', client_secret: 'clientSecret', redirect_uris: ['https://app/callback'] };

  test('posts to the provided endpoint', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'tok' } });
    await sfService.getTokenAuthCode('code123', 'https://auth.example.com/token', clientConfig);
    expect(axios.post).toHaveBeenCalledWith(
      'https://auth.example.com/token',
      expect.any(String),
      expect.any(Object)
    );
  });

  test('sends client_id and client_secret in request body', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await sfService.getTokenAuthCode('code', 'https://auth.example.com/token', clientConfig);

    const body = axios.post.mock.calls[0][1];
    expect(body).toContain('client_id=clientId');
    expect(body).toContain('client_secret=clientSecret');
  });

  test('returns response data', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'mytoken', token_type: 'Bearer' } });
    const result = await sfService.getTokenAuthCode('code', 'https://endpoint', clientConfig);
    expect(result).toEqual({ access_token: 'mytoken', token_type: 'Bearer' });
  });

  test('propagates axios errors', async () => {
    axios.post.mockRejectedValue(new Error('network error'));
    await expect(sfService.getTokenAuthCode('code', 'https://endpoint', clientConfig))
      .rejects.toThrow('network error');
  });
});

describe('getTokenClientCreds', () => {
  const clientConfig = { client_id: 'cid', client_secret: 'csec' };

  test('uses client_credentials grant type', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'tok' } });
    await sfService.getTokenClientCreds('https://endpoint', clientConfig);

    const body = axios.post.mock.calls[0][1];
    expect(body).toContain('grant_type=client_credentials');
  });

  test('includes client_id and client_secret in body', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await sfService.getTokenClientCreds('https://endpoint', clientConfig);

    const body = axios.post.mock.calls[0][1];
    expect(body).toContain('client_id=cid');
    expect(body).toContain('client_secret=csec');
  });

  test('returns response data', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'cc_token' } });
    const result = await sfService.getTokenClientCreds('https://endpoint', clientConfig);
    expect(result).toEqual({ access_token: 'cc_token' });
  });
});

describe('createAccount', () => {
  test('posts to Salesforce Account sobject URL', async () => {
    axios.post.mockResolvedValue({ data: { id: 'acc001' } });
    await sfService.createAccount('mytoken', { Name: 'Test Account' });

    const url = axios.post.mock.calls[0][0];
    expect(url).toContain('/sobjects/Account');
  });

  test('sends Bearer auth header', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await sfService.createAccount('mytoken', {});

    const headers = axios.post.mock.calls[0][2].headers;
    expect(headers.Authorization).toBe('Bearer mytoken');
  });

  test('returns response data', async () => {
    axios.post.mockResolvedValue({ data: { id: 'acc001', success: true } });
    const result = await sfService.createAccount('tok', { Name: 'Acme' });
    expect(result).toEqual({ id: 'acc001', success: true });
  });
});

describe('downloadReport', () => {
  test('sends GET request to report URL', async () => {
    axios.get.mockResolvedValue({ data: Buffer.from('xlsx') });
    await sfService.downloadReport('mytoken');

    const url = axios.get.mock.calls[0][0];
    expect(url).toContain('/analytics/reports/');
  });

  test('sends Bearer auth header', async () => {
    axios.get.mockResolvedValue({ data: Buffer.from('') });
    await sfService.downloadReport('reporttoken');

    const headers = axios.get.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer reporttoken');
  });

  test('returns response data', async () => {
    const binary = Buffer.from('fakexlsx');
    axios.get.mockResolvedValue({ data: binary });
    const result = await sfService.downloadReport('tok');
    expect(result).toBe(binary);
  });
});

describe('headlessPasswordReset', () => {
  test('posts username and captchaToken in request body', async () => {
    axios.post.mockResolvedValue({ data: { status: 'ok' } });
    await sfService.headlessPasswordReset('user@test.com', 'captcha123');

    const body = axios.post.mock.calls[0][1];
    expect(body.username).toBe('user@test.com');
    expect(body.recaptcha).toBe('captcha123');
  });

  test('returns response data', async () => {
    axios.post.mockResolvedValue({ data: { identifier: 'abc' } });
    const result = await sfService.headlessPasswordReset('u', 'c');
    expect(result).toEqual({ identifier: 'abc' });
  });
});

describe('webToCase', () => {
  test('posts to the Salesforce Web-to-Case URL', async () => {
    axios.post.mockResolvedValue({ data: 'ok' });
    await sfService.webToCase();

    const url = axios.post.mock.calls[0][0];
    expect(url).toContain('webto.salesforce.com/servlet/servlet.WebToCase');
  });

  test('sends form-encoded body', async () => {
    axios.post.mockResolvedValue({ data: 'ok' });
    await sfService.webToCase();

    const headers = axios.post.mock.calls[0][2].headers;
    expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');

    const url = axios.post.mock.calls[0][0];
    expect(url).toContain('orgId=00D5j00000CvOSL');
    const body = axios.post.mock.calls[0][1];
    expect(typeof body).toBe('string');
  });

  test('returns response data', async () => {
    axios.post.mockResolvedValue({ data: '<html>success</html>' });
    const result = await sfService.webToCase();
    expect(result).toBe('<html>success</html>');
  });

  test('propagates axios errors', async () => {
    axios.post.mockRejectedValue(new Error('network error'));
    await expect(sfService.webToCase()).rejects.toThrow('network error');
  });
});

describe('testConnectivity', () => {
  const clientConfig = { client_id: 'cid', client_secret: 'csec', redirect_uris: ['https://clintox.xyz/auth/callbackbyoca'] };
  const instanceUrl = 'https://myorg.my.salesforce.com';
  const tokenEndpoint = `${instanceUrl}/services/oauth2/token`;
  const code = 'authcode';

  test('returns tokenAcquired, recordCount, and instanceUrl on success', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'tok' } });
    axios.get.mockResolvedValue({ data: { totalSize: 4, records: [] } });

    const result = await sfService.testConnectivity(tokenEndpoint, clientConfig, instanceUrl, code);

    expect(result).toEqual({ tokenAcquired: true, recordCount: 4, instanceUrl });
  });

  test('uses access_token from token response in SOQL query', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'mytoken' } });
    axios.get.mockResolvedValue({ data: { totalSize: 1, records: [] } });

    await sfService.testConnectivity(tokenEndpoint, clientConfig, instanceUrl, code);

    const headers = axios.get.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer mytoken');
  });

  test('propagates error when token request fails', async () => {
    axios.post.mockRejectedValue(new Error('auth failed'));

    await expect(sfService.testConnectivity(tokenEndpoint, clientConfig, instanceUrl, code))
      .rejects.toThrow('auth failed');
  });
});

describe('headlessPasswordSet', () => {
  test('posts all four fields in request body', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await sfService.headlessPasswordSet('user@test.com', '123456', 'newPass!', 'rctoken');

    const body = axios.post.mock.calls[0][1];
    expect(body.username).toBe('user@test.com');
    expect(body.otp).toBe('123456');
    expect(body.newpassword).toBe('newPass!');
    expect(body.recaptcha).toBe('rctoken');
  });

  test('returns response data', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    const result = await sfService.headlessPasswordSet('u', 'o', 'p', 'r');
    expect(result).toEqual({ success: true });
  });
});
