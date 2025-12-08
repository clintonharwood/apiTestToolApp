const helmet = require("helmet");

module.exports = helmet({
    contentSecurityPolicy: {
      directives: {
        frameSrc: [
          "https://test.clintox.xyz/",
          "https://clintoxsupport.my.salesforce-sites.com",
          "https://devorg0923com-dev-ed--c.develop.vf.force.com",
          "https://api.clintox.xyz",
          "https://devorg0923com-dev-ed.develop.lightning.force.com",
        ],
        scriptSrc: [
          "'self'",
          "https://getbootstrap.com",
          "https://cdn.jsdelivr.net",
          "https://d1q000001eewuuaa-dev-ed.develop.my.site.com",
          "https://charwood-231102-76-demo.my.salesforce.com",
          "'sha256-5spuWCVR8naaA9qHWsLq9BLZVhf+GmOU7bYeAW/YKl8='",
          "https://www.googletagmanager.com",
          "'sha256-01McX6yilenjHdhh6gHZhqoQd8yF5YZ0HT/Lg0X0ZJU='",
          "'sha256-ndtgPgVtujsEhQjCvETtfn17lotkVcRabh9McELqQHA='",
        ],
        imgSrc: [
          "'self'",
          "https://getbootstrap.com",
          "https://upload.wikimedia.org",
        ],
        connectSrc: [
          "'self'",
          "https://charwood-231102-76-demo.my.salesforce.com",
          "https://www.google-analytics.com",
        ],
      },
    },
  });