const samlify = require("samlify");
const fs = require("fs");
const path = require("path");

function loadPem(envVar, filePath) {
  if (process.env[envVar]) return Buffer.from(process.env[envVar], "base64").toString("utf8");
  const full = path.resolve(__dirname, "../../", filePath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

const privateKey = loadPem("IDP_PRIVATE_KEY", "certs/idp-key.pem");
const cert = loadPem("IDP_CERT", "certs/idp-cert.pem");

const idpConfigured = !!(
  privateKey &&
  cert &&
  process.env.SP_ENTITY_ID &&
  process.env.SP_ACS_URL
);

let idp = null;
let sp = null;

if (idpConfigured) {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3003}`;
  const entityID = process.env.IDP_ENTITY_ID || `${baseUrl}/idp/metadata`;

  idp = samlify.IdentityProvider({
    entityID,
    privateKey,
    signingCert: cert,
    singleSignOnService: [
      {
        Binding: samlify.Constants.BindingNamespace.Redirect,
        Location: `${baseUrl}/idp/sso`,
      },
      {
        Binding: samlify.Constants.BindingNamespace.Post,
        Location: `${baseUrl}/idp/sso`,
      },
    ],
    isAssertionEncrypted: false,
    wantAuthnRequestsSigned: !!process.env.SP_CERT,
  });

  const spConfig = {
    entityID: process.env.SP_ENTITY_ID,
    assertionConsumerService: [
      {
        Binding: samlify.Constants.BindingNamespace.Post,
        Location: process.env.SP_ACS_URL,
      },
    ],
  };
  if (process.env.SP_CERT) {
    spConfig.signingCert = Buffer.from(process.env.SP_CERT, "base64").toString("utf8");
  }

  sp = samlify.ServiceProvider(spConfig);
}

module.exports = { idp, sp, idpConfigured };
