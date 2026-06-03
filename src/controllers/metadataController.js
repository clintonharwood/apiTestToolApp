const axios = require('axios');

const API_VERSION = 'v60.0';
const TIMEOUT = 15000;

exports.showPage = (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect('/auth');
  }
  res.render('metadata');
};

exports.getObjects = async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const query = 'SELECT QualifiedApiName, Label FROM EntityDefinition ORDER BY QualifiedApiName LIMIT 500';
    const response = await axios.get(
      `${req.session.instanceUrl}/services/data/${API_VERSION}/tooling/query?q=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${req.session.accessToken}` },
        timeout: TIMEOUT,
      }
    );
    const objects = response.data.records.map(r => ({
      name: r.QualifiedApiName,
      label: r.Label
    }));
    res.json({ objects });
  } catch (err) {
    console.error('Metadata getObjects error:', err.response?.status, err.response?.data);
    res.status(500).json({ error: 'Failed to fetch objects' });
  }
};

exports.getFields = async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { name } = req.params;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    return res.status(400).json({ error: 'Invalid object name' });
  }
  try {
    const query = `SELECT QualifiedApiName, Label, DataType, Length FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = '${name}'`;
    const response = await axios.get(
      `${req.session.instanceUrl}/services/data/${API_VERSION}/tooling/query?q=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${req.session.accessToken}` },
        timeout: TIMEOUT,
      }
    );
    const fields = response.data.records.map(r => ({
      name: r.QualifiedApiName,
      label: r.Label,
      type: r.DataType,
      required: r.IsRequired,
      length: r.Length,
    }));
    res.json({ fields, objectName: name });
  } catch (err) {
    console.error('Metadata getFields error:', err.response?.status, err.response?.data);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
};
