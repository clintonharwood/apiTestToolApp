# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start       # Start the server (node app.js) on port 3003 or $PORT
npm test        # Run all Jest tests
```

Run `npm test` after every code change and ensure all tests pass before considering a task complete.

## Architecture

A Node.js/Express app for testing Salesforce OAuth flows and APIs. It's a single-process server with server-side EJS rendering and session-based state for OAuth flows.

**Request flow**: `app.js` → `src/routes/index.js` (38+ routes) → controllers → services → EJS views.

**Controllers** (all in `src/controllers/`):
- `authController.js` — OAuth initiation and callbacks
- `apiController.js` — generic Salesforce API calls
- `soqlController.js` — SOQL query execution
- `lightningOutController.js` — Lightning Out / LWC rendering
- `headlessApiController.js` — Headless API (password reset flows)
- `webToCaseController.js` — Web-to-Case form
- `chaosController.js` — chaos testing

**Services** (all in `src/services/`):
- `salesforceService.js` — Axios wrapper for Salesforce API calls
- `chaosService.js` — chaos testing logic

**OAuth config** lives entirely in `src/config/authConfig.js`: five OAuth client configs (`one`–`five`; client five is the username/password flow) and five auth server definitions (`authServerOne`, `authServerTwo`, `salesforceAuthServer`, `salesforceAuthServerClientCredsFlow`, `authServerThree`). Environment variables provide the secrets at runtime — see the object structure in that file to know which `process.env.*` vars are required.

**Session state** carries the OAuth handshake: `req.session.oauthState` (CSRF), `req.session.accessToken`, `req.session.action`, `req.session.authServer`, `req.session.oauthClientKey`, `req.session.instanceUrl`, and `req.session.lightningOutState`. Multiple named callback routes (`/callback`, `/callbacknoncommunity`, `/callbackreuse`, `/callbackcodeexchange`) differentiate which OAuth server to use when exchanging the code.

**CSP** is centralized in `src/config/csp.js` and applied via Helmet in `app.js`. A per-request nonce (`res.locals.cspNonce`) is generated in `app.js` and must be passed through to any inline scripts/styles. Extend CSP directives in `csp.js` when adding new external script/style sources.

**Error handling**: `src/utils/helpers.js` exports `handleAxiosError` — use it for all Salesforce API calls. It unwraps Axios error responses and renders the error view.

**Rate limiting** uses `express-rate-limit`:
- SOQL runner: 30 requests per 15 minutes
- Headless reset endpoints: 10 requests per 15 minutes

**Feature flags** (env vars checked at startup, exposed as `res.locals`):
- `DISABLE_CLIENT_CREDENTIALS=true` — disables client-credentials OAuth flow routes
- `DISABLE_WEB_TO_CASE=true` — disables the Web-to-Case form route

**Deployment**: Heroku (Procfile: `web: npm start`). The app trusts Heroku's TLS proxy (`trust proxy 1`) and redirects HTTP → HTTPS via the `x-forwarded-proto` header. Session cookies are `secure: true`. CORS origin is controlled by the `CORS_ORIGIN` env var (defaults to `https://clintox.xyz`).
