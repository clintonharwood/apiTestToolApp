require('dotenv').config();
const express = require("express");
const logger = require("morgan");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");

// Configuration
const cspConfig = require("./config/csp");
const routes = require("./routes/index");

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(logger("short"));
app.use(cors());
app.use(helmet({ xFrameOptions: { action: "sameorigin" } }));
app.use(cspConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 60000 * 30 } // 30 mins
}));

// Routes
app.use("/", routes);

// 404 Handle
app.use((req, res) => res.status(404).render("error", { error: "Page not found" }));

app.listen(PORT, () => {
  console.log(`App started on port ${PORT}`);
});