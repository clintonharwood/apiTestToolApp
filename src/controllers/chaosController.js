const chaosService = require('../services/chaosService');

/**
 * Renders the chaos testing page, indicating whether an active OAuth session exists.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.showChaos = (req, res) => {
  res.render('chaos', { results: null, hasToken: !!req.session.accessToken });
};

/**
 * Runs chaos probes against the Salesforce Account object using the session token and returns the results as JSON.
 * Requires an active OAuth session; returns 401 if none is present.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.runChaos = async (req, res) => {
  const { accessToken, instanceUrl } = req.session;
  if (!accessToken || !instanceUrl) {
    return res.status(401).json({ error: 'No active session. Complete an OAuth flow first.' });
  }
  try {
    const results = await chaosService.runProbes(accessToken, instanceUrl);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
