var express = require("express");

var api = express.Router();

api.get("/", function(req, res) {
    res.status(200);
    res.send("You just sent a GET request to v2");
});

api.post("/", function(req, res) {
    res.send("A POST request to v2");
});

api.put("/", function(req, res) {
    res.send("A PUT request to v2");
});

api.delete("/", function(req, res) {
    res.send("A DELETE request to v2");
});

module.exports = api;