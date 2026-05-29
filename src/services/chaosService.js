const axios = require('axios');

const SOBJECT_PATH = '/services/data/v60.0/sobjects/Account';
const TIMEOUT = 15000;

const authHeader = (token) => ({
  'Content-Type': 'application/json',
  Authorization: 'Bearer ' + token,
});

/**
 * Executes a single chaos probe function, captures its HTTP status, response body,
 * elapsed time, and whether it passed or threw.
 * @param {string} label - Human-readable name for the probe
 * @param {() => Promise<import('axios').AxiosResponse>} fn - The axios call to execute
 * @returns {Promise<{label: string, status: number|string, body: any, ms: number, passed: boolean}>}
 */
const probe = async (label, fn) => {
  const start = Date.now();
  try {
    const result = await fn();
    return { label, status: result.status, body: result.data, ms: Date.now() - start, passed: true };
  } catch (err) {
    const res = err.response;
    return {
      label,
      status: res?.status ?? 'ERR',
      body: res?.data ?? { message: err.message },
      ms: Date.now() - start,
      passed: false,
    };
  }
};

const VALID_INSTANCE_URL = /^https:\/\/[a-zA-Z0-9-]+\.my\.salesforce\.com$/;

/**
 * Runs six chaos probes against the Salesforce Account sObject, each exercising a
 * different invalid-input scenario (missing field, wrong type, oversized value, etc.).
 * @param {string} accessToken - Salesforce Bearer token
 * @param {string} instanceUrl - Salesforce instance base URL (e.g. https://org.my.salesforce.com)
 * @returns {Promise<Array<{label: string, status: number|string, body: any, ms: number, passed: boolean}>>}
 */
exports.runProbes = async (accessToken, instanceUrl) => {
  if (!VALID_INSTANCE_URL.test(instanceUrl)) {
    throw new Error('Invalid instance URL');
  }
  const url = instanceUrl + SOBJECT_PATH;

  return Promise.all([
    probe('Missing required field (no Name)', () =>
      axios.post(url, {}, { headers: authHeader(accessToken), timeout: TIMEOUT })
    ),
    probe('Wrong type: Name is integer', () =>
      axios.post(url, { Name: 99999 }, { headers: authHeader(accessToken), timeout: TIMEOUT })
    ),
    probe('Oversized Name field (256 chars)', () =>
      axios.post(url, { Name: 'A'.repeat(256) }, { headers: authHeader(accessToken), timeout: TIMEOUT })
    ),
    probe('Null required field', () =>
      axios.post(url, { Name: null }, { headers: authHeader(accessToken), timeout: TIMEOUT })
    ),
    probe('Unknown field injection', () =>
      axios.post(url, { Name: 'Chaos Test', __nonexistent_field__: true }, { headers: authHeader(accessToken), timeout: TIMEOUT })
    ),
    probe('Empty string Name', () =>
      axios.post(url, { Name: '' }, { headers: authHeader(accessToken), timeout: TIMEOUT })
    ),
  ]);
};
