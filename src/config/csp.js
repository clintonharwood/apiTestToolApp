const helmet = require("helmet");

module.exports = (nonce) => helmet({
    contentSecurityPolicy: {
      directives: {
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
          "https://clintoxsupport.my.salesforce.com"
        ],
        styleSrc: [
          "'self'",
          `'nonce-${nonce}'`,
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
"https://www.googletagmanager.com"
        ],
        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://www.google.com",
          "https://clintoxsupport.my.salesforce.com"
        ],
      },
    },
  });
