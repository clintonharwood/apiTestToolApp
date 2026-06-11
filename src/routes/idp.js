const express = require("express");
const { idp, sp, idpConfigured } = require("../config/idpConfig");

const router = express.Router();

// GET /idp/metadata — IdP metadata XML for SP configuration
router.get("/idp/metadata", (req, res) => {
  if (!idpConfigured) {
    return res.status(503).send("IdP is not configured.");
  }
  res.type("application/xml");
  res.send(idp.getMetadata());
});

// Shared handler for both GET (redirect binding) and POST (post binding)
async function handleSsoRequest(binding, req, res, next) {
  if (!idpConfigured) {
    return res.status(503).send("IdP is not configured.");
  }

  // If not authenticated, stash the SAML request and redirect to login
  if (!req.isAuthenticated()) {
    req.session.pendingSamlRequest = {
      binding,
      SAMLRequest: req.query.SAMLRequest || req.body.SAMLRequest,
      RelayState: req.query.RelayState || req.body.RelayState,
    };
    return req.session.save((err) => {
      if (err) return next(err);
      res.redirect("/login");
    });
  }

  try {
    // Reconstruct the request object with the stored or current SAML params
    const pending = req.session.pendingSamlRequest;
    const samlReq = req.method === "GET" ? req : { body: pending || req.body, query: pending || req.query };
    const effectiveBinding = (pending && pending.binding) || binding;
    const relayState = (pending && pending.RelayState) || req.query.RelayState || req.body.RelayState || "";

    // Parse the AuthnRequest (may be absent for IdP-initiated flow — pass null)
    let requestInfo = {};
    const hasSamlRequest = !!(samlReq.query?.SAMLRequest || samlReq.body?.SAMLRequest);
    if (hasSamlRequest) {
      requestInfo = await idp.parseLoginRequest(sp, effectiveBinding, samlReq);
    }

    // Build the signed assertion
    const { context: samlResponse, entityEndpoint: acsUrl } = await idp.createLoginResponse(
      sp,
      requestInfo,
      "post",
      {
        email: req.user.email || req.user.username || req.user._id.toString(),
        displayName: req.user.displayName || req.user.username,
        username: req.user.username,
      },
      { relayState, customTagReplacement: (tmpl) => ({ context: tmpl }) }
    );

    // Clean up stashed request
    delete req.session.pendingSamlRequest;
    req.session.save(() => {
      res.render("saml-post-form", {
        acsUrl: acsUrl || process.env.SP_ACS_URL,
        samlResponse,
        relayState,
      });
    });
  } catch (err) {
    next(err);
  }
}

// GET /idp/sso — HTTP Redirect binding (most common SP-initiated flow)
router.get("/idp/sso", (req, res, next) => handleSsoRequest("redirect", req, res, next));

// POST /idp/sso — HTTP POST binding
router.post("/idp/sso", (req, res, next) => handleSsoRequest("post", req, res, next));

module.exports = router;
