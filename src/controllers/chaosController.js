const chaosService = require('../services/chaosService');

exports.showChaos = (req, res) => {
  res.render('chaos', { results: null, hasToken: !!req.session.accessToken });
};

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
