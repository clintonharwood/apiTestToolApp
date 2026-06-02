const helmet = require("helmet");

/**
 * Returns a configured Helmet Content Security Policy middleware for the given
 * per-request nonce. The nonce must be included in any inline scripts or styles.
 * @param {string} nonce - The CSP nonce generated for this request
 * @returns {import('express').RequestHandler} Helmet CSP middleware
 */
module.exports = (nonce) => helmet({
    contentSecurityPolicy: {
      directives: {
        formAction: ["'self'"],
        frameSrc: [
          "https://test.clintox.xyz/",
          "https://clintoxsupport.my.salesforce-sites.com",
          "https://devorg0923com-dev-ed--c.develop.vf.force.com",
          "https://api.clintox.xyz",
          "https://devorg0923com-dev-ed.develop.lightning.force.com",
          "https://www.google.com",
          "https://clintoxsupport.my.salesforce.com",
          "https://clintoxsupport.file.force.com",
          "https://clintox.xyz/serveReport/download"
        ],
        scriptSrc: [
          "'self'",
          `'nonce-${nonce}'`,
          "https://www.googletagmanager.com",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://clintoxsupport.my.salesforce.com",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrc: [
          "'self'",
          `'nonce-${nonce}'`,
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "https://www.googletagmanager.com",
          "data:"
        ],
        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://www.google.com",
          "https://clintoxsupport.my.salesforce.com"
        ],
        objectSrc: ["'none'"],
      },
    },
  });
