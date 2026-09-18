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

  test('sends client_id and redirect_uri in request body', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await sfService.getTokenAuthCode('code', 'https://auth.example.com/token', clientConfig);

    const body = axios.post.mock.calls[0][1];
    expect(body).toContain('client_id=clientId');
    expect(body).toContain('redirect_uri=');
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
  const instanceUrl = 'https://myorg.my.salesforce.com';

  test('posts to Salesforce Account sobject URL', async () => {
    axios.post.mockResolvedValue({ data: { id: 'acc001' } });
    await sfService.createAccount('mytoken', instanceUrl, { Name: 'Test Account' });

    const url = axios.post.mock.calls[0][0];
    expect(url).toContain('/sobjects/Account');
    expect(url).toContain(instanceUrl);
  });

  test('sends Bearer auth header', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await sfService.createAccount('mytoken', instanceUrl, {});

    const headers = axios.post.mock.calls[0][2].headers;
    expect(headers.Authorization).toBe('Bearer mytoken');
  });

  test('returns response data', async () => {
    axios.post.mockResolvedValue({ data: { id: 'acc001', success: true } });
    const result = await sfService.createAccount('tok', instanceUrl, { Name: 'Acme' });
    expect(result).toEqual({ id: 'acc001', success: true });
  });
});

describe('downloadReport', () => {
  const instanceUrl = 'https://myorg.my.salesforce.com';
  const reportId = '00O000000000000AAA';

  test('sends GET request to report URL', async () => {
    axios.get.mockResolvedValue({ data: Buffer.from('xlsx') });
    await sfService.downloadReport('mytoken', instanceUrl, reportId);

    const url = axios.get.mock.calls[0][0];
    expect(url).toContain('/analytics/reports/');
    expect(url).toContain(reportId);
  });

  test('sends Bearer auth header', async () => {
    axios.get.mockResolvedValue({ data: Buffer.from('') });
    await sfService.downloadReport('reporttoken', instanceUrl, reportId);

    const headers = axios.get.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer reporttoken');
  });

  test('returns response data', async () => {
    const binary = Buffer.from('fakexlsx');
    axios.get.mockResolvedValue({ data: binary });
    const result = await sfService.downloadReport('tok', instanceUrl, reportId);
    expect(result).toBe(binary);
  });
});

describe('headlessPasswordReset', () => {
  const siteUrl = 'https://myorg.my.site.com/portal';

  test('posts username and captchaToken in request body', async () => {
    axios.post.mockResolvedValue({ data: { status: 'ok' } });
    await sfService.headlessPasswordReset('user@test.com', 'captcha123', siteUrl);

    const body = axios.post.mock.calls[0][1];
    expect(body.username).toBe('user@test.com');
    expect(body.recaptcha).toBe('captcha123');
  });

  test('posts to the site forgot_password endpoint', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await sfService.headlessPasswordReset('u', 'c', siteUrl);

    const url = axios.post.mock.calls[0][0];
    expect(url).toContain(siteUrl);
    expect(url).toContain('forgot_password');
  });

  test('returns response data', async () => {
    axios.post.mockResolvedValue({ data: { identifier: 'abc' } });
    const result = await sfService.headlessPasswordReset('u', 'c', siteUrl);
    expect(result).toEqual({ identifier: 'abc' });
  });
});

describe('webToCase', () => {
  const orgId = '00D000000000000AAA';

  test('posts to the Salesforce Web-to-Case URL', async () => {
    axios.post.mockResolvedValue({ data: 'ok' });
    await sfService.webToCase({}, orgId);

    const url = axios.post.mock.calls[0][0];
    expect(url).toContain('webto.salesforce.com/servlet/servlet.WebToCase');
  });

  test('sends form-encoded body with correct orgId', async () => {
    axios.post.mockResolvedValue({ data: 'ok' });
    await sfService.webToCase({}, orgId);

    const headers = axios.post.mock.calls[0][2].headers;
    expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');

    const url = axios.post.mock.calls[0][0];
    expect(url).toContain(`orgId=${orgId}`);
    const body = axios.post.mock.calls[0][1];
    expect(typeof body).toBe('string');
  });

  test('returns response data', async () => {
    axios.post.mockResolvedValue({ data: '<html>success</html>' });
    const result = await sfService.webToCase({}, orgId);
    expect(result).toBe('<html>success</html>');
  });

  test('propagates axios errors', async () => {
    axios.post.mockRejectedValue(new Error('network error'));
    await expect(sfService.webToCase({}, orgId)).rejects.toThrow('network error');
  });
});

describe('headlessPasswordSet', () => {
  const siteUrl = 'https://myorg.my.site.com/portal';

  test('posts all four fields in request body', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await sfService.headlessPasswordSet('user@test.com', '123456', 'newPass!', 'rctoken', siteUrl);

    const body = axios.post.mock.calls[0][1];
    expect(body.username).toBe('user@test.com');
    expect(body.otp).toBe('123456');
    expect(body.newpassword).toBe('newPass!');
    expect(body.recaptcha).toBe('rctoken');
  });

  test('posts to the site forgot_password endpoint', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await sfService.headlessPasswordSet('u', 'o', 'p', 'r', siteUrl);

    const url = axios.post.mock.calls[0][0];
    expect(url).toContain(siteUrl);
  });

  test('returns response data', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    const result = await sfService.headlessPasswordSet('u', 'o', 'p', 'r', siteUrl);
    expect(result).toEqual({ success: true });
  });
});
