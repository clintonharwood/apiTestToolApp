var express = require("express");
var logger = require("morgan");
var path = require("path");
var timeout = require("connect-timeout");

var app = express();

app.use(logger("short"));

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");
app.set("port", process.env.PORT || 3000);

app.get("/", function(req, res) {
    res.render("index");
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

app.post("/v1", function(req, res) {
    res.status(201);
    res.json({ result: "Record created"});
});

app.put("/v1", function(req, res) {
    res.send("A PUT request to v1");
});

app.delete("/v1", function(req, res) {
    res.send("A DELETE request to v1");
});

app.listen(process.env.PORT || 3000, function() {
    console.log("App started on port 3000");
});
