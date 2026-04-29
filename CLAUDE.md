# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start       # Start the server (node app.js) on port 3000 or $PORT
npm test        # Run all Jest tests
```

Run `npm test` after every code change and ensure all tests pass before considering a task complete.

## Architecture

A Node.js/Express app for testing Salesforce OAuth flows and APIs. It's a single-process server with server-side EJS rendering and session-based state for OAuth flows.

**Request flow**: `app.js` → `src/routes/index.js` (all 21+ routes) → controllers → `src/services/salesforceService.js` (Axios wrapper for Salesforce API calls) → EJS views.

**OAuth config** lives entirely in `src/config/authConfig.js`: four OAuth client configs (`oAuthClient1`–`4`) and three auth server definitions. Environment variables provide the secrets at runtime — see the object structure in that file to know which `process.env.*` vars are required.

**Session state** carries the OAuth handshake: `req.session.state` (CSRF), `req.session.access_token`, `req.session.action_type`, and instance/community URL fields. Multiple named callback routes (`/callback`, `/callbacknoncommunity`, `/callbackreuse`) differentiate which OAuth server to use when exchanging the code.

**CSP** is centralized in `src/config/csp.js` and applied via Helmet in `app.js`. Extend CSP directives there when adding new external script/style sources (Lightning Out, external CDNs, etc.).

**Error handling**: `src/utils/helpers.js` exports `handleAxiosError` — use it for all Salesforce API calls. It unwraps Axios error responses and renders the error view.

**Deployment**: Heroku (Procfile: `web: npm start`). Session cookies use `secure: false` intentionally for local development — flip this for HTTPS deployments.
