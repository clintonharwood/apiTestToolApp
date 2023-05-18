var express = require("express");
var morgan = require("morgan");

var app = express();


var apiV1 = require("./apiv1.js");
var apiV2 = require("./apiv2.js");

app.set("port", process.env.PORT || 3000);

app.use("/v1", apiV1);
app.use("/v2", apiV2);

app.listen(3000, function() {
    console.log("App started on port 3000");
});
