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
          "https://www.google.com",
          "https://clintoxsupport.my.salesforce.com",
          "https://clintoxsupport.file.force.com"
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
          "https://www.google.com",
          "https://www.gstatic.com",
          "'sha256-IZoI+xJzbHf5q475rrGdGKFFRqEumHmPYjEjr7H1vP4='",
          "'sha256-LuC1ojY/N5Zjvttgyzvv5jIxqXLrQdwRQsm14xxtcvs='",
          "'sha256-dmyOBVqWWItlJZLd20ovmaS98qGbMq3hfbtMhQ9fb0w='",
          "'nonce-8IBTHwOdqNKAWeKl7plt8gmnshey987=='",
          "'nonce-8IBTHwOdqNKAWeKl7plt8gmnshaskdjdud=='",
          "https://clintoxsupport.my.salesforce.com"
        ],
        imgSrc: [
          "'self'",
          "https://getbootstrap.com",
          "https://upload.wikimedia.org",
          "https://www.googletagmanager.com"
        ],
        connectSrc: [
          "'self'",
          "https://charwood-231102-76-demo.my.salesforce.com",
          "https://www.google-analytics.com",
          "https://cdn.jsdelivr.net",
          "https://www.google.com",
          "https://clintoxsupport.my.salesforce.com"
        ],
      },
    },
  });