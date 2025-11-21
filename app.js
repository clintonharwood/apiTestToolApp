var express = require("express");
var logger = require("morgan");
var path = require("path");
var timeout = require("connect-timeout");
var url = require("url");
var qs = require("qs");
var querystring = require("querystring");
var cons = require("consolidate");
var randomstring = require("randomstring");
var __ = require("underscore");
__.string = require("underscore.string");
var cors = require("cors");
var helmet = require("helmet");
const axios = require('axios');

const salesforceDocs = [
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_anonymous_block.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_curl.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_Auth_AuthConfiguration.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_quickstart_retrieve_add_components.htm",
  "https://developer.salesforce.com/docs/component-library/bundle/lightning-accordion/example",
  "https://developer.salesforce.com/docs/component-library/bundle/aura:component/documentation",
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_debugging_system_log_console.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_limits.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_Auth_OAuthRefreshResult.htm#apex_Auth_OAuthRefreshResult_constructors",
  "https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/file_based.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/langCon_apex_switch.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/langCon_apex_primitives.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_json_jsongenerator.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_encoding.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/quickstart_using_other_tools.htm",
  "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/headers_duplicaterules.htm",
  "https://developer.salesforce.com/docs/component-library/bundle/ui:button/example",
  "https://developer.salesforce.com/docs/component-library/bundle/lightning-file-upload/documentation",
  "https://developer.salesforce.com/docs/component-library/bundle/lightning-layout-item/example",
  "https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_rest_deploy.htm",
  "https://developer.salesforce.com/docs/einstein/genai/guide/agent-api.html",
];

var app = express();
app.use(cors());

app.use(logger("short"));

app.use(helmet({ xFrameOptions: { action: "sameorigin" } }));

app.use(
  helmet({
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
  })
);

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");
app.set("port", process.env.PORT || 3000);

var authServerOne = {
  authorizationEndpoint:
    "https://test.clintox.xyz/employees/services/oauth2/authorize",
  tokenEndpoint: "https://test.clintox.xyz/employees/services/oauth2/token",
};

var authServerTwo = {
  authorizationEndpoint:
    "https://clintoxsupport.my.site.com/employees/services/oauth2/authorize",
  tokenEndpoint:
    "https://clintoxsupport.my.site.com/employees/services/oauth2/token",
};

var salesforceAuthServer = {
  authorizationEndpoint:
    "https://clintoxsupport.my.salesforce.com/services/oauth2/authorize",
  tokenEndpoint:
    "https://clintoxsupport.my.salesforce.com/services/oauth2/token",
};

var salesforceAuthServerClientCredsFlow = {
  tokenEndpoint:
    "https://clintoxsupport.my.salesforce.com/services/oauth2/token",
};

var authServerThree = {
  authorizationEndpoint:
    "https://api.clintox.xyz/emp/services/oauth2/authorize",
  tokenEndpoint: "https://api.clintox.xyz/emp/services/oauth2/token",
};

// client information
var client = {
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLENT_SECRET,
  redirect_uris: ["https://clintox.xyz/callback"],
};

var clientTwo = {
  client_id: process.env.CLIENT_ID_TWO,
  client_secret: process.env.CLENT_SECRET_TWO,
  redirect_uris: ["https://clintox.xyz/callbacknoncommunity"],
};

var clientThree = {
  client_id: process.env.CLIENT_ID_THREE,
  client_secret: process.env.CLIENT_SECRET_THREE,
  redirect_uris: ["https://clintox.xyz/callbackclientcredsflow"],
};

var clientFour = {
  client_id: process.env.CLIENT_ID_FOUR,
  client_secret: process.env.CLIENT_SECRET_FOUR,
  redirect_uris: ["https://clintox.xyz/callbackreuse"],
};

var clientFive = {
  client_id: process.env.CLIENT_ID_FIVE,
  client_secret: process.env.CLIENT_SECRET_FIVE,
  redirect_uris: ["https://clintox.xyz/callbackcodeexchange"],
  username: process.env.UN,
  password: process.env.PW
};

var state = null;

var access_token = null;
var scope = null;
var isAuthServerOne = false;
var isCreateAccount = false;
var isDownloadReport = false;

app.get("/webtocase", function (req, res) {
  /*requestModule.post({url: 'https://webto.salesforce.com/servlet/servlet.WebToCase?encoding=UTF-8&orgId=00D5j00000CvOSL&debug=1&debugEmail=clinto_is%40hotmail.com', 
	form: {
		orgid: '00D5j00000CvOSL',
		name: 'Donald',
		email: 'clinto_is@hotmail.com',
		phone: '0432202726',
		subject: 'Help Me with clintox website',
		description: 'Getting an ISE'
	}}, function(err, httpResponse, body) {
		console.log('Error: ' + err);
		console.log('httpResponse: ' + httpResponse);
		console.log('body: ' + body);

		res.render('webtocaseresult',{result: body});
	});*/

  //requestModule.get('https://webto.salesforce.com/servlet/servlet.WebToCase?encoding=UTF-8&orgId=00D5j00000CvOSL&orgid=00D5j00000CvOSL&retURL=http%3A%2F%2F&name=Donald&email=clinto_is%40hotamil.com&phone=0323202928&subject=Test&description=Test&submit=Submit&debug=1&debugEmail=clinto_is%40hotmail.com');

  res.render("webtocaseresult", { result: "Success" });
});

app.get("/casedetailsvfpage", function (req, res) {
  res.render("casedetailsvfpage");
});

app.get("/authorizeone", function (req, res) {
  access_token = null;
  isAuthServerOne = true;
  state = randomstring.generate();

  var authorizeUrl = buildUrl(authServerOne.authorizationEndpoint, {
    response_type: "code",
    client_id: client.client_id,
    redirect_uri: client.redirect_uris[0],
    state: state,
  });

  console.log("redirect", authorizeUrl);
  res.redirect(authorizeUrl);
});

app.get("/authorizetwo", function (req, res) {
  access_token = null;
  isAuthServerOne = false;

  state = randomstring.generate();

  var authorizeUrl = buildUrl(authServerTwo.authorizationEndpoint, {
    response_type: "code",
    client_id: client.client_id,
    redirect_uri: client.redirect_uris[0],
    state: state,
  });

  console.log("redirect", authorizeUrl);
  res.redirect(authorizeUrl);
});

app.get("/authorizereuse", function(req, res) {
  access_token = null;
  isAuthServerOne = false;

  state = randomstring.generate();

  var authorizeUrl = buildUrl(authServerTwo.authorizationEndpoint, {
    response_type: "code",
    client_id: clientFour.client_id,
    redirect_uri: clientFour.redirect_uris[0],
    state: state,
  });

  console.log("redirect", authorizeUrl);
  res.redirect(authorizeUrl);
});

app.get("/authorizeCodeCredsFlow", async function(req, res) {
  access_token = null;

  var form_data = qs.stringify({
    response_type: "code_credentials",
    client_id: clientFive.client_id,
    redirect_uri: clientFive.redirect_uris[0],
  });

  var headers = {
    "Auth-Request-Type": "Named-User",
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      encodeClientCredentials(clientFive.UN, clientFive.PW),
  };

  console.log("Requesting access token for code authorizeCodeCredsFlow");

  const url = authServerThree.authorizationEndpoint;
  const options = {
    method: 'POST',
    headers: headers,
    data: form_data,
    url
  };

  let reqBody = null;

  try {
    const tokRes = await axios(options);
    if (tokRes.status >= 200 && tokRes.status < 300) {
    reqBody = JSON.parse(tokRes.data);

    access_token = reqBody.access_token;
    console.log("Status code: %s", tokRes.status);

    res.render("clientindex", { access_token: access_token, scope: scope });
    } else {
      res.render("error", {
        error:
          "Unable to authorize: " + reqBody,
      });
    }
  } catch (err) {
    console.log(tokRes.status);
    console.log(tokRes.data)
    res.render("error", {
      error:
        "Unable to authorize: " + reqBody,
    });
  }
});

app.get("/callbackcodeexchange", function (req, res) {
  if (req.query.error) {
    // it's an error response, act accordingly
    res.render("error", { error: req.query.error });
    return;
  }

  var code = req.query.code;

  var form_data = qs.stringify({
    grant_type: "authorization_code",
    code: code,
    client_id: clientFive.client_id,
    redirect_uri: client.redirect_uris[0],
  });
  var headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      encodeClientCredentials(client.client_id, client.client_secret),
  };

  var authTokenEndpoint = isAuthServerOne
    ? authServerOne.tokenEndpoint
    : authServerTwo.tokenEndpoint;
  var tokRes = request("POST", authServerThree.tokenEndpoint, {
    body: form_data,
    headers: headers,
  });

  console.log("Requesting access token for code %s", code);

  if (tokRes.statusCode >= 200 && tokRes.statusCode < 300) {
    var body = JSON.parse(tokRes.getBody());

    access_token = body.access_token;
    console.log("Got access token: %s", access_token);

    res.render("clientindex", { access_token: access_token, scope: scope });
  } else {
    res.render("error", {
      error:
        "Unable to fetch access token, server response: " + tokRes.statusCode,
    });
  }
});

app.get("/callback", function (req, res) {
  if (req.query.error) {
    // it's an error response, act accordingly
    res.render("error", { error: req.query.error });
    return;
  }

  if (req.query.state != state) {
    console.log(
      "State DOES NOT MATCH: expected %s got %s",
      state,
      req.query.state
    );
    res.render("error", { error: "State value did not match" });
    return;
  }

  var code = req.query.code;

  var form_data = qs.stringify({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: client.redirect_uris[0],
  });
  var headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      encodeClientCredentials(client.client_id, client.client_secret),
  };

  var authTokenEndpoint = isAuthServerOne
    ? authServerOne.tokenEndpoint
    : authServerTwo.tokenEndpoint;
  var tokRes = request("POST", authTokenEndpoint, {
    body: form_data,
    headers: headers,
  });

  console.log("Requesting access token for code %s", code);

  if (tokRes.statusCode >= 200 && tokRes.statusCode < 300) {
    var body = JSON.parse(tokRes.getBody());

    access_token = body.access_token;
    console.log("Got access token: %s", access_token);

    res.render("clientindex", { access_token: access_token, scope: scope });
  } else {
    res.render("error", {
      error:
        "Unable to fetch access token, server response: " + tokRes.statusCode,
    });
  }
});

app.get("/callbackreuse", function (req, res) {
  if (req.query.error) {
    // it's an error response, act accordingly
    res.render("error", { error: req.query.error });
    return;
  }

  if (req.query.state != state) {
    console.log(
      "State DOES NOT MATCH: expected %s got %s",
      state,
      req.query.state
    );
    res.render("error", { error: "State value did not match" });
    return;
  }

  var code = req.query.code;
  console.log("Requesting access token for code %s", code);
  res.render("clientindex", { access_token: '', scope: '' });
});

app.get("/callbacknoncommunity", function (req, res) {
  if (req.query.error) {
    // it's an error response, act accordingly
    res.render("error", { error: req.query.error });
    return;
  }

  if (req.query.state != state) {
    console.log(
      "State DOES NOT MATCH: expected %s got %s",
      state,
      req.query.state
    );
    res.render("error", { error: "State value did not match" });
    return;
  }

  var code = req.query.code;

  var form_data = qs.stringify({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: clientTwo.redirect_uris[0],
  });
  var headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      encodeClientCredentials(clientTwo.client_id, clientTwo.client_secret),
  };

  var authTokenEndpoint = salesforceAuthServer.tokenEndpoint;
  var tokRes = request("POST", authTokenEndpoint, {
    body: form_data,
    headers: headers,
  });

  console.log("Requesting access token for code %s", code);

  if (tokRes.statusCode >= 200 && tokRes.statusCode < 300) {
    var body = JSON.parse(tokRes.getBody());

    access_token = body.access_token;
    console.log("Got access token: %s", access_token);

    if (isCreateAccount) {
      var salesforceApiheaders = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + access_token,
      };

      var apiCall = request(
        "POST",
        "https://clintoxsupport.my.salesforce.com/services/data/v60.0/sobjects/Account",
        {
          body: JSON.stringify({ Name: "Clintox API Test Tool" }),
          headers: salesforceApiheaders,
        }
      );
      console.log(apiCall.statusCode);
      res.render("createaccountui", { result: apiCall.body });
    } else if (isDownloadReport) {
      var salesforceApiheaders = {
        "Content-Type": "application/json",
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        Authorization: "Bearer " + access_token,
      };

      var apiCall = request(
        "GET",
        "https://clintoxsupport.my.salesforce.com/services/data/v60.0/analytics/reports/00O5K000000XecLUAS",
        {
          headers: salesforceApiheaders,
        }
      );

      req.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.attachment("report.xlsx");
      res.send(apiCall.body);
    }
  } else {
    res.render("error", {
      error:
        "Unable to fetch access token, server response: " + tokRes.statusCode,
    });
  }
});

app.get("/callbackclientcredsflow", function (req, res) {
  console.log("Inside callbackclientcredsflow");
});

app.get("/authorizeThree", function (req, res) {
  var form_data = qs.stringify({
    grant_type: "client_credentials",
    client_id: clientThree.client_id,
    client_secret: clientThree.client_secret,
  });

  var headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  var authTokenEndpoint = salesforceAuthServerClientCredsFlow.tokenEndpoint;
  var tokRes = request("POST", authTokenEndpoint, {
    body: form_data,
    headers: headers,
  });

  console.log("Requesting access token");

  if (tokRes.statusCode >= 200 && tokRes.statusCode < 300) {
    var body = JSON.parse(tokRes.getBody());

    console.log("Got access token: %s", body.access_token);
    res.render("clientindex", { access_token: "Success" });
  } else {
    res.render("error", {
      error:
        "Unable to fetch access token, server response: " + tokRes.statusCode,
    });
  }
});

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/api", function (req, res) {
  res.render("api");
});

app.get("/auth", function (req, res) {
  res.render("clientindex", { access_token: access_token, scope: scope });
});

app.get("/cmoney", function (req, res) {
  res.render("cmoney");
});

app.get("/randomsfpage", function (req, res) {
  res.render("sfpagegen");
});

app.get("/random", function (req, res) {
  const randomIndex = Math.floor(Math.random() * salesforceDocs.length);
  res.redirect(salesforceDocs[randomIndex]);
});

app.get("/v1/all", function (req, res) {
  setTimeout(() => {
    res.status(200);
    res.json({
      products: [
        {
          id: 1,
          title: "Phone",
          description: "A mobile which is nothing like apple",
          price: 549,
          discountPercentage: 12.96,
          rating: 4.69,
          stock: 94,
          category: "smartphones",
        },
        {
          id: 2,
          title: "Wallet",
          description: "Plain leather wallet",
          price: 89,
          discountPercentage: 17.94,
          rating: 4.44,
          stock: 34,
          category: "wallets",
        },
        {
          id: 3,
          title: "Hat",
          description: "Plain black baseball hat",
          price: 20,
          discountPercentage: 15.46,
          rating: 4.09,
          stock: 36,
          category: "clothing",
        },
      ],
    })
  }, 20000);
});

app.get("/v1/500", function (req, res) {
  res.status(500);
  res.json({ result: "500 error" });
});

app.get("/v1/timeout", timeout("140s"), function (req, res) {});

app.post("/v1/create", function (req, res) {
  console.log(JSON.stringify(req.headers));
  res.status(201);
  res.json({ result: "Record created" });
});

app.put("/v1", function (req, res) {
  res.send("A PUT request to v1");
});

app.delete("/v1", function (req, res) {
  res.send("A DELETE request to v1");
});

app.get("/createaccount", function (req, res) {
  isCreateAccount = true;
  res.redirect(authorize());
});

app.get("/downloadReport", function (req, res) {
  isDownloadReport = true;
  res.redirect(authorize());
});

app.get("/createPlatformEvent", function (req, res) {
  res.render("platformEvent", { pe_response: "" });
});

app.get("/publishPlatfromEvent", function (req, res) {
  // Get an access token
  var form_data = qs.stringify({
    grant_type: "client_credentials",
    client_id: clientThree.client_id,
    client_secret: clientThree.client_secret,
  });

  var headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  var authTokenEndpoint = salesforceAuthServerClientCredsFlow.tokenEndpoint;
  var tokRes = request("POST", authTokenEndpoint, {
    body: form_data,
    headers: headers,
  });

  console.log("Requesting access token");

  if (tokRes.statusCode >= 200 && tokRes.statusCode < 300) {
    var body = JSON.parse(tokRes.getBody());

    console.log("Got access token: %s", body.access_token);
    // Got a valid token now pulbish a Platform Event
    var platformEventEndpointUrl =
      "https://clintoxsupport.my.salesforce.com/services/data/v63.0/sobjects/Clintox_Test_Event__e/";
    var pe_form_data = {
      Order_id__c: "po1002",
    };
    var peHeaders = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + body.access_token,
    };

    var eventRes = request("POST", platformEventEndpointUrl, {
      json: pe_form_data,
      headers: peHeaders,
    });

    if (eventRes.statusCode >= 200 && eventRes.statusCode < 300) {
      var body = JSON.parse(eventRes.getBody());

      console.log(
        "Platform Event Success: %s",
        eventRes.statusCode + " " + eventRes.body
      );
      res.render("platformEvent", { pe_response: eventRes.body });
    } else {
      res.render("error", {
        error: "Unable to Publish platform Event: " + eventRes.statusCode,
      });
    }
  } else {
    res.render("error", {
      error:
        "Unable to fetch access token, server response: " + tokRes.statusCode,
    });
  }
});

app.get("/miaw", function (req, res) {
  res.render("miaw", { miaw_response: "" });
});

app.get("/sendFileMIAW", function (req, res) {
  let pload =
    "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";
  let uuid = generateUUID();
  console.log(uuid);

  const authEndpoint =
    "https://clintoxsupport.my.salesforce-scrt.com/iamessage/api/v2/authorization/unauthenticated/access-token";
  const convoEndpoint =
    "https://clintoxsupport.my.salesforce-scrt.com/iamessage/api/v2/conversation";
  let sendFileEndpoint = `https://clintoxsupport.my.salesforce-scrt.com/iamessage/api/v2/conversation/${uuid}/file`;

  var accessToken;

  // Get an access token
  var headers = {
    "Content-Type": "application/json",
  };

  var form_data = {
    orgId: "00D5K0000008aqr",
    esDeveloperName: "Service_For_Web_Custom_Client",
    capabilitiesVersion: "1",
    platform: "Web",
  };

  var tokRes = request("POST", authEndpoint, {
    json: form_data,
    headers: headers,
  });

  console.log("Requesting access token");

  if (tokRes.statusCode >= 200 && tokRes.statusCode < 300) {
    var body = JSON.parse(tokRes.getBody());
    accessToken = body.accessToken;
    console.log("Got access token: " + accessToken);

    //create conversation
    var coHeaders = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    };

    var conForm_data = {
      conversationId: uuid,
      esDeveloperName: "Service_For_Web_Custom_Client",
    };

    var eventRes = request("POST", convoEndpoint, {
      json: conForm_data,
      headers: coHeaders,
    });

    console.log("Starting conversation");
    if (eventRes.statusCode >= 200 && eventRes.statusCode < 300) {
      var body = eventRes.getBody();
      console.log("Created Conversation");

      //send file
      let stringBody = `--a7V4kRcFA8E79pivMuV2tukQ85cmNKeoEgJgq\r
      Content-Disposition: form-data; name="messageEntry";\r
      Content-Type: application/json\r
      {\r
        "esDeveloperName": "Service_For_Web_Custom_Client",\r
        "message": {\r
          "id": "ed6dd834-0096-40fe-a534-6a6987203ce1",\r
          "fileId": "89a18e5f-81c2-4e95-8212-c748b4af22c96",\r
          "text": "Lights on my broken router look like this"\r
        }\r
      }\r
      --a7V4kRcFA8E79pivMuV2tukQ85cmNKeoEgJgq\r
      Content-Type: application/octet-stream\r
      Content-Disposition: form-data; name="fileData"; filename=sun.jpeg;\r
      ${pload}\r
      --a7V4kRcFA8E79pivMuV2tukQ85cmNKeoEgJgq--`;

      var sHeaders = {
        "Content-Type":
          "multipart/form-data; boundary=a7V4kRcFA8E79pivMuV2tukQ85cmNKeoEgJgq",
        Authorization: accessToken,
      };

      var sendRes = request("POST", sendFileEndpoint, {
        body: stringBody,
        headers: sHeaders,
      });

      console.log("Sending file");
      if (sendRes.statusCode >= 200 && sendRes.statusCode < 300) {
        var body = JSON.parse(sendRes.getBody());
        console.log("Sent file: %s", body);
        res.render("miaw", { miaw_response: body });
      } else {
        res.render("error", {
          error: "Unable to Send file: " + sendRes.statusCode,
        });
      }
    } else {
      res.render("error", {
        error:
          "Unable to create conversation, server response: " +
          eventRes.statusCode,
      });
    }
  } else {
    res.render("error", {
      error:
        "Unable to fetch access token, server response: " + tokRes.statusCode,
    });
  }
});

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

var authorize = function () {
  access_token = null;

  state = randomstring.generate();

  var authorizeUrl = buildUrl(salesforceAuthServer.authorizationEndpoint, {
    response_type: "code",
    client_id: clientTwo.client_id,
    redirect_uri: clientTwo.redirect_uris[0],
    state: state,
  });

  console.log("redirect", authorizeUrl);
  return authorizeUrl;
};

var buildUrl = function (base, options, hash) {
  var newUrl = url.parse(base, true);
  delete newUrl.search;
  if (!newUrl.query) {
    newUrl.query = {};
  }
  __.each(options, function (value, key, list) {
    newUrl.query[key] = value;
  });
  if (hash) {
    newUrl.hash = hash;
  }

  return url.format(newUrl);
};

var encodeClientCredentials = function (clientId, clientSecret) {
  return Buffer.from(
    querystring.escape(clientId) + ":" + querystring.escape(clientSecret)
  ).toString("base64");
};

app.listen(process.env.PORT || 3000, function () {
  console.log("App started on port 3000");
});
