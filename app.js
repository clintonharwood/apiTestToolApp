var express = require("express");

var app = express();

app.set("port", process.env.PORT || 3000);

app.get("/v1/all", function(req, res) {
    res.send("You just sent a GET request to v1");
});

app.post("/v1", function(req, res) {
    res.send("A POST request to v1");
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
