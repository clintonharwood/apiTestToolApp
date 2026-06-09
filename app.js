require('dotenv').config();
const crypto = require("crypto");
const express = require("express");
const logger = require("morgan");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const { MongoStore } = require("connect-mongo");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => { console.error("MongoDB connection error:", err); process.exit(1); });

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) throw new Error("SESSION_SECRET environment variable is required");

// Configuration
const buildCspConfig = require("./src/config/csp");
const routes = require("./src/routes/index");

const app = express();
const PORT = process.env.PORT || 3003;

// Trust Heroku's TLS-terminating proxy so secure cookies work
app.set("trust proxy", 1);

// Redirect HTTP → HTTPS (Heroku terminates TLS, so check the forwarded proto)
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] === "http") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

// View Engine
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

// Per-request CSP nonce — must run before helmet/csp
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
  next();
});

// Middleware
app.use(logger("short"));
app.use(cors({ origin: process.env.CORS_ORIGIN || "https://clintox.xyz", credentials: true }));
app.use((req, res, next) => buildCspConfig(res.locals.cspNonce)(req, res, next));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session — backed by MongoDB so it survives restarts/deploys
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: "lax", maxAge: 60000 * 30 },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Static assets
app.use(express.static(path.join(__dirname, "public")));

// Serve favicon
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.resolve(__dirname, "src/images/favicon.ico"));
});

// Feature flags
app.use((req, res, next) => {
  res.locals.clientCredsEnabled = process.env.DISABLE_CLIENT_CREDENTIALS !== 'true';
  res.locals.webToCaseEnabled   = process.env.DISABLE_WEB_TO_CASE !== 'true';
  next();
});

// Routes
app.use("/", routes);

// 404 Handle
app.use((req, res) => res.status(404).render("error", { error: "Page not found" }));

app.listen(PORT, () => {
  console.log(`App started on port ${PORT}`);
});