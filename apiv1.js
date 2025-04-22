var express = require("express");

var api = express.Router();

api.get("/", function (req, res) {
  res.send("You just sent a GET request to v1");
});

api.post("/", function (req, res) {
  res.send("A POST request to v1");
});

api.put("/", function (req, res) {
  res.send("A PUT request to v1");
});

api.delete("/", function (req, res) {
  res.send("A DELETE request to v1");
});

module.exports = api;
