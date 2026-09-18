const INSTANCE_URL_PATTERN = /^https:\/\/[a-zA-Z0-9-]+\.(my\.salesforce|salesforce|force)\.com(\/|$)/;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3003';

exports.showSetup = (req, res) => {
  res.render('setup', { orgConfig: req.session.orgConfig || {}, error: null, baseUrl: BASE_URL });
};

exports.saveSetup = (req, res) => {
  const { instanceUrl, clientId, siteUrl, webToCaseOrgId, lightningAppId, reportId, platformEventName } = req.body;

  if (!instanceUrl || !clientId) {
    return res.render('setup', {
      orgConfig: req.body,
      error: 'Instance URL and Client ID are required.',
      baseUrl: BASE_URL,
    });
  }

  const normalizedUrl = instanceUrl.replace(/\/$/, '');
  if (!INSTANCE_URL_PATTERN.test(normalizedUrl + '/')) {
    return res.render('setup', {
      orgConfig: req.body,
      error: 'Instance URL must be a valid Salesforce domain (e.g. https://myorg.my.salesforce.com).',
      baseUrl: BASE_URL,
    });
  }

  // Experience Cloud sites can run on customer-owned custom domains, so we don't
  // restrict siteUrl to Salesforce domains — but it must be a valid https URL to
  // avoid SSRF into internal hosts via other schemes (e.g. http://169.254.169.254).
  let normalizedSiteUrl = null;
  if (siteUrl && siteUrl.trim()) {
    const trimmedSiteUrl = siteUrl.trim().replace(/\/$/, '');
    let parsedSiteUrl;
    try {
      parsedSiteUrl = new URL(trimmedSiteUrl);
    } catch (e) {
      parsedSiteUrl = null;
    }
    if (!parsedSiteUrl || parsedSiteUrl.protocol !== 'https:') {
      return res.render('setup', {
        orgConfig: req.body,
        error: 'Site URL must be a valid https URL (e.g. https://mysite.my.site.com).',
        baseUrl: BASE_URL,
      });
    }
    normalizedSiteUrl = trimmedSiteUrl;
  }

  req.session.orgConfig = {
    instanceUrl: normalizedUrl,
    clientId: clientId.trim(),
    siteUrl: normalizedSiteUrl,
    webToCaseOrgId: webToCaseOrgId ? webToCaseOrgId.trim() : null,
    lightningAppId: lightningAppId ? lightningAppId.trim() : null,
    reportId: reportId ? reportId.trim() : null,
    platformEventName: platformEventName ? platformEventName.trim() : null,
  };

  req.session.save((err) => {
    if (err) return res.render('setup', { orgConfig: req.body, error: 'Session error. Please try again.', baseUrl: BASE_URL });
    res.redirect('/');
  });
};

exports.clearSetup = (req, res) => {
  delete req.session.orgConfig;
  delete req.session.accessToken;
  delete req.session.instanceUrl;
  req.session.save(() => res.redirect('/setup'));
};
