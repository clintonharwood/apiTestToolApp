const helmet = require("helmet");

/**
 * Returns a configured Helmet Content Security Policy middleware for the given
 * per-request nonce. Allows any Salesforce org domain so the app works with
 * user-supplied orgs.
 * @param {string} nonce - The CSP nonce generated for this request
 * @returns {import('express').RequestHandler} Helmet CSP middleware
 */
module.exports = (nonce) => helmet({
    contentSecurityPolicy: {
      directives: {
        formAction: [
          "'self'",
          "https://*.salesforce.com",
          "https://*.site.com",
          "https://webto.salesforce.com",
        ],
        frameSrc: [
          "'self'",
          "https://*.salesforce.com",
          "https://*.salesforce-sites.com",
          "https://*.force.com",
          "https://*.site.com",
          "https://www.google.com",
        ],
        // Only same-origin pages may embed this app in an iframe; blocks
        // clickjacking / hotlinking of our content (e.g. /video) by other sites.
        frameAncestors: ["'self'"],
        scriptSrc: [
          "'self'",
          `'nonce-${nonce}'`,
          "https://www.googletagmanager.com",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://*.salesforce.com",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: [
          "'self'",
          `'nonce-${nonce}'`,
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],
        imgSrc: [
          "'self'",
          "https://www.googletagmanager.com",
          "data:",
        ],
        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://www.google.com",
          "https://*.salesforce.com",
          "https://*.site.com",
          "https://*.force.com",
        ],
        objectSrc: ["'none'"],
      },
    },
  });
