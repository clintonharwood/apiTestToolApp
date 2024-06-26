var express = require("express");
var logger = require("morgan");
var path = require("path");
var timeout = require("connect-timeout");
var request = require("sync-request");
var url = require("url");
var qs = require("qs");
var querystring = require('querystring');
var cons = require('consolidate');
var randomstring = require("randomstring");
var __ = require('underscore');
__.string = require('underscore.string');
var cors = require("cors");
//var requestModule = require('request');
var helmet = require("helmet");

var app = express();
app.use(cors());

app.use(logger("short"));

app.use(helmet({xFrameOptions: { action: "sameorigin"},}));

app.use(
	helmet({
	  contentSecurityPolicy: {
		directives: {
			frameSrc: ['https://test.clintox.xyz/','https://clintoxsupport.my.salesforce-sites.com','https://devorg0923com-dev-ed--c.develop.vf.force.com','https://api.clintox.xyz', 'https://devorg0923com-dev-ed.develop.lightning.force.com'],
			scriptSrc: ["'self'","https://getbootstrap.com","https://cdn.jsdelivr.net","https://d1q000001eewuuaa-dev-ed.develop.my.site.com","https://charwood-231102-76-demo.my.salesforce.com","'sha256-5spuWCVR8naaA9qHWsLq9BLZVhf+GmOU7bYeAW/YKl8='"],
			imgSrc: ["'self'","https://getbootstrap.com","https://upload.wikimedia.org"],
			connectSrc: ["'self'", "https://charwood-231102-76-demo.my.salesforce.com"]
		},
	  },
	}),
  );

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");
app.set("port", process.env.PORT || 3000);

var authServerOne = {
	authorizationEndpoint: 'https://test.clintox.xyz/employees/services/oauth2/authorize',
	tokenEndpoint: 'https://test.clintox.xyz/employees/services/oauth2/token'
};

var authServerTwo = {
	authorizationEndpoint: 'https://clintoxsupport.my.site.com/employees/services/oauth2/authorize',
	tokenEndpoint: 'https://clintoxsupport.my.site.com/employees/services/oauth2/token'
};

var salesforceAuthServer = {
	authorizationEndpoint: 'https://clintoxsupport.my.salesforce.com/services/oauth2/authorize',
	tokenEndpoint: 'https://clintoxsupport.my.salesforce.com/services/oauth2/token'
};

var salesforceAuthServerClientCredsFlow = {
	tokenEndpoint: 'https://clintoxsupport.my.salesforce.com/services/oauth2/token'
};


// client information
var client = {
	"client_id": process.env.CLIENT_ID,
	"client_secret": process.env.CLENT_SECRET,
	"redirect_uris": ["https://clintox.xyz/callback"]
};

var clientTwo = {
	"client_id": process.env.CLIENT_ID_TWO,
	"client_secret": process.env.CLENT_SECRET_TWO,
	"redirect_uris": ["https://clintox.xyz/callbacknoncommunity"]
};

var clientThree = {
	"client_id": process.env.CLIENT_ID_THREE,
	"client_secret": process.env.CLIENT_SECRET_THREE,
	"redirect_uris": ["https://clintox.xyz/callbackclientcredsflow"]
};

var state = null;

var access_token = null;
var scope = null;
var isAuthServerOne = false;
var isCreateAccount = false;
var isDownloadReport = false;

app.get('/webtocase', function(req, res) {

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

	res.render('webtocaseresult',{result: 'Success'});
});

app.get('/casedetailsvfpage', function(req, res) {
	res.render("casedetailsvfpage");
});

app.get('/authorizeone', function(req, res) {

	access_token = null;
	isAuthServerOne = true;

	state = randomstring.generate();
	
	var authorizeUrl = buildUrl(authServerOne.authorizationEndpoint, {
		response_type: 'code',
		client_id: client.client_id,
		redirect_uri: client.redirect_uris[0],
		state: state
	});
	
	console.log("redirect", authorizeUrl);
	res.redirect(authorizeUrl);
});

app.get('/authorizetwo', function(req, res) {

	access_token = null;
	isAuthServerOne = false;

	state = randomstring.generate();
	
	var authorizeUrl = buildUrl(authServerTwo.authorizationEndpoint, {
		response_type: 'code',
		client_id: client.client_id,
		redirect_uri: client.redirect_uris[0],
		state: state
	});
	
	console.log("redirect", authorizeUrl);
	res.redirect(authorizeUrl);
});

app.get('/callback', function(req, res) {
	
	if (req.query.error) {
		// it's an error response, act accordingly
		res.render('error', {error: req.query.error});
		return;
	}
	
	if (req.query.state != state) {
		console.log('State DOES NOT MATCH: expected %s got %s', state, req.query.state);
		res.render('error', {error: 'State value did not match'});
		return;
	}

	var code = req.query.code;

	var form_data = qs.stringify({
		grant_type: 'authorization_code',
		code: code,
		redirect_uri: client.redirect_uris[0]
	});
	var headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Authorization': 'Basic ' + encodeClientCredentials(client.client_id, client.client_secret)
	};

	var authTokenEndpoint = isAuthServerOne ? authServerOne.tokenEndpoint : authServerTwo.tokenEndpoint
	var tokRes = request('POST', authTokenEndpoint, {	
			body: form_data,
			headers: headers
	});

	console.log('Requesting access token for code %s',code);
	
	if (tokRes.statusCode >= 200 && tokRes.statusCode < 300) {
		var body = JSON.parse(tokRes.getBody());
	
		access_token = body.access_token;
		console.log('Got access token: %s', access_token);
		
		res.render('clientindex', {access_token: access_token, scope: scope});
	} else {
		res.render('error', {error: 'Unable to fetch access token, server response: ' + tokRes.statusCode})
	}
});

app.get('/callbacknoncommunity', function(req, res) {
	
	if (req.query.error) {
		// it's an error response, act accordingly
		res.render('error', {error: req.query.error});
		return;
	}
	
	if (req.query.state != state) {
		console.log('State DOES NOT MATCH: expected %s got %s', state, req.query.state);
		res.render('error', {error: 'State value did not match'});
		return;
	}

	var code = req.query.code;

	var form_data = qs.stringify({
		grant_type: 'authorization_code',
		code: code,
		redirect_uri: clientTwo.redirect_uris[0]
	});
	var headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Authorization': 'Basic ' + encodeClientCredentials(clientTwo.client_id, clientTwo.client_secret)
	};

	var authTokenEndpoint = salesforceAuthServer.tokenEndpoint;
	var tokRes = request('POST', authTokenEndpoint, {	
			body: form_data,
			headers: headers
	});

	console.log('Requesting access token for code %s',code);
	
	if (tokRes.statusCode >= 200 && tokRes.statusCode < 300) {
		var body = JSON.parse(tokRes.getBody());
	
		access_token = body.access_token;
		console.log('Got access token: %s', access_token);

		if (isCreateAccount) {
			var salesforceApiheaders = {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + access_token
			};
	
			var apiCall = request('POST', 'https://clintoxsupport.my.salesforce.com/services/data/v60.0/sobjects/Account', {	
				body: JSON.stringify({Name: 'Clintox API Test Tool'}),
				headers: salesforceApiheaders
			});
			console.log(apiCall.statusCode);
			res.render('createaccountui', {result: apiCall.body});
		} else if (isDownloadReport) {
			var salesforceApiheaders = {
				'Content-Type': 'application/json',
				'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Authorization': 'Bearer ' + access_token
			};
	
			var apiCall = request('GET', 'https://clintoxsupport.my.salesforce.com/services/data/v60.0/analytics/reports/00O5K000000XecLUAS', {	
				headers: salesforceApiheaders
			});

			req.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			res.attachment('report.xlsx');
			res.send(apiCall.body);
		}
	} else {
		res.render('error', {error: 'Unable to fetch access token, server response: ' + tokRes.statusCode})
	}
});

app.get('/callbackclientcredsflow', function(req, res) {
	console.log('Inside callbackclientcredsflow');
});

app.get('/authorizeThree', function(req, res) {

	var form_data = qs.stringify({
		grant_type: 'client_credentials',
		client_id: clientThree.client_id,
		client_secret: clientThree.client_secret
	});

	var headers = {
		'Content-Type': 'application/x-www-form-urlencoded'
	};

	var authTokenEndpoint = salesforceAuthServerClientCredsFlow.tokenEndpoint;
	var tokRes = request('POST', authTokenEndpoint, {	
			body: form_data,
			headers: headers
	});

	console.log('Requesting access token');
	
	if (tokRes.statusCode >= 200 && tokRes.statusCode < 300) {
		var body = JSON.parse(tokRes.getBody());
	
		console.log('Got access token: %s', body.access_token);
		res.render('clientindex', {access_token: 'Success'});
	} else {
		res.render('error', {error: 'Unable to fetch access token, server response: ' + tokRes.statusCode})
	}
});

app.get("/", function(req, res) {
    res.render("index");
});

app.get('/auth', function (req, res) {
	res.render('clientindex', {access_token: access_token, scope: scope});
});

app.get("/cmoney", function(req, res) {
    res.render("cmoney");
});

app.get("/v1/all", function(req, res) {
    res.status(200);
    res.json({"products": [{ "id": 1, "title": "Phone", "description": "A mobile which is nothing like apple", "price": 549, "discountPercentage": 12.96, "rating": 4.69, "stock": 94, "category": "smartphones" }, { "id": 2, "title": "Wallet", "description": "Plain leather wallet", "price": 89, "discountPercentage": 17.94, "rating": 4.44, "stock": 34, "category": "wallets" }, { "id": 3, "title": "Hat", "description": "Plain black baseball hat", "price": 20, "discountPercentage": 15.46, "rating": 4.09, "stock": 36, "category": "clothing" }]});
});

app.get("/v1/500", function(req, res) {
    res.status(500);
    res.json({ result: "500 error"});
});

app.get("/v1/timeout", timeout("140s"), function(req, res) {
});

app.post("/v1/create", function(req, res) {
	console.log(JSON.stringify(req.headers));
    res.status(201);
    res.json({ result: "Record created"});
});

app.put("/v1", function(req, res) {
    res.send("A PUT request to v1");
});

app.delete("/v1", function(req, res) {
    res.send("A DELETE request to v1");
});

app.get('/createaccount', function(req, res) {
	isCreateAccount = true;
	res.redirect(authorize());
});

app.get('/downloadReport', function(req, res) {
	isDownloadReport = true;
	res.redirect(authorize());
});

var authorize = function() {
	access_token = null;

	state = randomstring.generate();
	
	var authorizeUrl = buildUrl(salesforceAuthServer.authorizationEndpoint, {
		response_type: 'code',
		client_id: clientTwo.client_id,
		redirect_uri: clientTwo.redirect_uris[0],
		state: state
	});
	
	console.log("redirect", authorizeUrl);
	return authorizeUrl;
}

var buildUrl = function(base, options, hash) {
	var newUrl = url.parse(base, true);
	delete newUrl.search;
	if (!newUrl.query) {
		newUrl.query = {};
	}
	__.each(options, function(value, key, list) {
		newUrl.query[key] = value;
	});
	if (hash) {
		newUrl.hash = hash;
	}
	
	return url.format(newUrl);
};

var encodeClientCredentials = function(clientId, clientSecret) {
	return Buffer.from(querystring.escape(clientId) + ':' + querystring.escape(clientSecret)).toString('base64');
};

app.listen(process.env.PORT || 3000, function() {
    console.log("App started on port 3000");
});
