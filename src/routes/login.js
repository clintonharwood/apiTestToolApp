const express = require("express");
const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: SamlStrategy } = require("@node-saml/passport-saml");
const User = require("../models/User");

const router = express.Router();

// ─── Passport: serialize / deserialize ──────────────────────────────────────

passport.serializeUser((user, done) => done(null, user._id.toString()));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ─── Local Strategy ──────────────────────────────────────────────────────────

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username.toLowerCase().trim() });
      if (!user || !user.passwordHash) {
        return done(null, false, { message: "Invalid credentials" });
      }
      const match = await user.verifyPassword(password);
      if (!match) return done(null, false, { message: "Invalid credentials" });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// ─── SAML Strategy ───────────────────────────────────────────────────────────
// Only registered when all four SAML env vars are present.
// TODO: Fill in SAML_ENTRY_POINT, SAML_ISSUER, SAML_CALLBACK_URL, SAML_IDP_CERT in .env.

const samlConfigured =
  process.env.SAML_ENTRY_POINT &&
  process.env.SAML_ISSUER &&
  process.env.SAML_CALLBACK_URL &&
  process.env.SAML_IDP_CERT;

if (samlConfigured) {
  passport.use(
    new SamlStrategy(
      {
        // The Salesforce IdP SSO endpoint (Single Sign-On URL from Setup > Identity > SSO Settings)
        entryPoint: process.env.SAML_ENTRY_POINT,
        // Service Provider Entity ID — identifies your app to Salesforce
        issuer: process.env.SAML_ISSUER,
        // Must match the Callback URL registered in Salesforce Connected App / SSO settings
        callbackUrl: process.env.SAML_CALLBACK_URL,
        // Salesforce X.509 certificate — paste without -----BEGIN/END CERTIFICATE----- headers
        idpCert: process.env.SAML_IDP_CERT,
        wantAssertionsSigned: true,
      },
      async (profile, done) => {
        try {
          const salesforceId = profile.nameID;
          if (!salesforceId) return done(null, false);
          const user = await User.findOneAndUpdate(
            { salesforceId },
            {
              $setOnInsert: {
                salesforceId,
                displayName: profile.displayName || profile["urn:oid:2.5.4.42"] || salesforceId,
                email: profile.email || profile["urn:oid:0.9.2342.19200300.100.1.3"],
              },
            },
            { upsert: true, new: true }
          );
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
      // Second verify function required by @node-saml/passport-saml for logout
      async (profile, done) => {
        try {
          if (!profile.nameID) return done(null, false);
          const user = await User.findOne({ salesforceId: profile.nameID });
          return done(null, user || false);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get("/login", (req, res) => {
  const errorType = req.query.error;
  let errorMessage = null;
  if (errorType === "1") errorMessage = "Invalid username or password. Please try again.";
  if (errorType === "sso") errorMessage = "Salesforce SSO sign-in failed. Please try again or contact your administrator.";
  if (errorType === "sso_unconfigured") errorMessage = "Salesforce SSO is not yet configured. Please sign in with your username and password.";
  res.render("login", { title: "Login — Clintox", errorMessage });
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect("/login?error=1");
    const pendingSamlRequest = req.session.pendingSamlRequest;
    req.session.regenerate((regenErr) => {
      if (regenErr) return next(regenErr);
      req.logIn(user, { session: false }, (loginErr) => {
        if (loginErr) return next(loginErr);
        req.session.passport = { user: user._id.toString() };
        if (pendingSamlRequest) req.session.pendingSamlRequest = pendingSamlRequest;
        const redirectTo = pendingSamlRequest ? "/idp/sso" : "/";
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          res.redirect(redirectTo);
        });
      });
    });
  })(req, res, next);
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/login");
  });
});

// Initiate SAML SSO — redirects user to Salesforce login
router.get("/auth/sso", (req, res, next) => {
  if (!samlConfigured) {
    return res.redirect("/login?error=sso_unconfigured");
  }
  passport.authenticate("saml")(req, res, next);
});

// Salesforce posts the SAML assertion here after authentication
router.post("/auth/sso/callback", (req, res, next) => {
  if (!samlConfigured) {
    return res.redirect("/login?error=sso_unconfigured");
  }
  passport.authenticate("saml", (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect("/login?error=sso");
    // Regenerate session before establishing auth to prevent session fixation
    req.session.regenerate((regenErr) => {
      if (regenErr) return next(regenErr);
      req.logIn(user, { session: false }, (loginErr) => {
        if (loginErr) return next(loginErr);
        req.session.passport = { user: user._id.toString() };
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          res.redirect("/");
        });
      });
    });
  })(req, res, next);
});

module.exports = router;
