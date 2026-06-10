const samlify = require("samlify");
const fs = require("fs");
const path = require("path");

function loadPem(envVar, filePath) {
  let pem;
  if (process.env[envVar]) {
    const raw = process.env[envVar];
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    // If decoded content has PEM headers, the env var is a base64-encoded full PEM file.
    // Otherwise, the env var is already a bare cert body (base64 of DER) — use it directly
    // to avoid double-decoding base64 → DER binary which produces garbage in the XML.
    pem = decoded.trimStart().startsWith("-----BEGIN") ? decoded : raw;
  } else {
    const full = path.resolve(__dirname, "../../", filePath);
    pem = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
  }
  return pem ? pem.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") : null;
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
