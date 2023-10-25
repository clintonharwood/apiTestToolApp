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

var app = express();

app.use(logger("short"));

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");
app.set("port", process.env.PORT || 3000);

var authServer = {
	authorizationEndpoint: 'https://test.clintox.xyz/employees/services/oauth2/authorize',
	tokenEndpoint: 'https://test.clintox.xyz/employees/services/oauth2/token'
};

// var authServer = {
// 	authorizationEndpoint: 'https://clintoxsupport.my.site.com/employees/services/oauth2/authorize',
// 	tokenEndpoint: 'https://clintoxsupport.my.site.com/employees/services/oauth2/token'
// };

// client information

var client = {
	"client_id": process.env.CLIENT_ID,
	"client_secret": process.env.CLENT_SECRET,
	"redirect_uris": ["https://clintox.xyz/callback"]
};

var state = null;

var access_token = null;
var scope = null;

app.get('/authorize', function(req, res) {

	access_token = null;

	state = randomstring.generate();
	
	var authorizeUrl = buildUrl(authServer.authorizationEndpoint, {
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

	var tokRes = request('POST', authServer.tokenEndpoint, {	
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
    res.status(201);
    res.json({ result: "Record created"});
});

app.put("/v1", function(req, res) {
    res.send("A PUT request to v1");
});

app.delete("/v1", function(req, res) {
    res.send("A DELETE request to v1");
});

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
