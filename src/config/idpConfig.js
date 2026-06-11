const samlify = require("samlify");
const fs = require("fs");
const path = require("path");

function loadPem(envVar, filePath, wrapAsPrivateKey = false) {
  let pem;
  if (process.env[envVar]) {
    const raw = process.env[envVar];
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    if (decoded.trimStart().startsWith("-----BEGIN")) {
      // Env var is a base64-encoded full PEM file — use the decoded string.
      pem = decoded;
    } else if (wrapAsPrivateKey) {
      // Bare base64 DER key body. samlify does not normalize private keys (unlike certs),
      // so wrap in PKCS#8 PEM headers before passing to xml-crypto / Node crypto.Sign.
      const body = raw.replace(/\s+/g, "").match(/.{1,64}/g).join("\n");
      pem = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
    } else {
      // Bare base64 cert body — samlify normalizes these internally, pass as-is.
      pem = raw;
    }
  } else {
    const full = path.resolve(__dirname, "../../", filePath);
    pem = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
  }
  return pem ? pem.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") : null;
}

const privateKey = loadPem("IDP_PRIVATE_KEY", "certs/idp-key.pem", true);
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
    // samlify defaults AuthnStatement to '' in its tag-value map, so the
    // placeholder is always dropped unless we bake it into the template.
    loginResponseTemplate: {
      context:
        '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="{ID}" Version="2.0" IssueInstant="{IssueInstant}" Destination="{Destination}" InResponseTo="{InResponseTo}">' +
        '<saml:Issuer>{Issuer}</saml:Issuer>' +
        '<samlp:Status><samlp:StatusCode Value="{StatusCode}"/></samlp:Status>' +
        '<saml:Assertion xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="{AssertionID}" Version="2.0" IssueInstant="{IssueInstant}">' +
        '<saml:Issuer>{Issuer}</saml:Issuer>' +
        '<saml:Subject>' +
        '<saml:NameID Format="{NameIDFormat}">{NameID}</saml:NameID>' +
        '<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">' +
        '<saml:SubjectConfirmationData NotOnOrAfter="{SubjectConfirmationDataNotOnOrAfter}" Recipient="{SubjectRecipient}" InResponseTo="{InResponseTo}"/>' +
        '</saml:SubjectConfirmation>' +
        '</saml:Subject>' +
        '<saml:Conditions NotBefore="{ConditionsNotBefore}" NotOnOrAfter="{ConditionsNotOnOrAfter}">' +
        '<saml:AudienceRestriction><saml:Audience>{Audience}</saml:Audience></saml:AudienceRestriction>' +
        '</saml:Conditions>' +
        '<saml:AuthnStatement AuthnInstant="{IssueInstant}">' +
        '<saml:AuthnContext>' +
        '<saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:X509</saml:AuthnContextClassRef>' +
        '</saml:AuthnContext>' +
        '</saml:AuthnStatement>' +
        '{AttributeStatement}' +
        '</saml:Assertion>' +
        '</samlp:Response>',
      attributes: [],
    },
  });

  // Without this, samlify's substitution path ignores loginResponseTemplate and
  // falls back to its default, dropping the AuthnStatement we baked in as literal XML.
  idp.entitySetting.tagPrefixedDefaults = {
    loginResponseTemplate: idp.entitySetting.loginResponseTemplate,
  };

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
