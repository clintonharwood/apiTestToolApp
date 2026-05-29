# Salesforce API Test Tool

A Node.js/Express sandbox for testing Salesforce OAuth flows, SOQL queries, and API integrations. Designed for developers building and debugging Salesforce connected apps.

## Live Site

https://clintox.xyz

## Features

- **Multiple OAuth flows** — authorization code, client credentials, token reuse, bring-your-own-credentials (BYOCA)
- **SOQL query runner** — execute queries against a connected Salesforce org
- **Headless identity** — Experience Cloud password reset/set with OTP verification
- **Chaos testing** — probe the Salesforce API with invalid inputs, oversized fields, null values, and type mismatches
- **Lightning Out / LWC rendering** — render Lightning Web Components via OAuth
- **Web-to-Case form** — test Salesforce case submission
- **Connectivity tester** — validate end-to-end connectivity with a custom org using your own credentials
- **Mock API endpoints** — simulate slow responses, errors, timeouts, and record creation

## Tech Stack

- **Runtime**: Node.js v24+
- **Framework**: Express.js
- **Templating**: EJS
- **HTTP client**: Axios
- **Security**: Helmet (CSP), express-session, express-rate-limit, CORS
- **Testing**: Jest

## Prerequisites

- Node.js v24+
- npm
- One or more Salesforce connected apps (OAuth clients) configured in your org(s)

## Getting Started

```bash
git clone <repo-url>
cd apiTestToolApp
npm install
cp .env.example .env   # then fill in your credentials
npm start              # http://localhost:3003
```

For development with auto-reload:

```bash
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and populate the values.

### Required

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Secret used to sign session cookies |
| `CLIENT_ID` | OAuth client ID for connected app 1 |
| `CLIENT_SECRET` | OAuth client secret for connected app 1 |
| `CLIENT_ID_TWO` | OAuth client ID for connected app 2 |
| `CLIENT_SECRET_TWO` | OAuth client secret for connected app 2 |
| `CLIENT_ID_THREE` | OAuth client ID for client credentials flow |
| `CLIENT_SECRET_THREE` | OAuth client secret for client credentials flow |
| `CLIENT_ID_FOUR` | OAuth client ID for token reuse scenario |
| `CLIENT_SECRET_FOUR` | OAuth client secret for token reuse scenario |
| `CLIENT_ID_FIVE` | OAuth client ID for username/password flow |
| `CLIENT_SECRET_FIVE` | OAuth client secret for username/password flow |
| `UN` | Salesforce username for client 5 (username/password flow) |
| `PW` | Salesforce password for client 5 |
| `SF_CLIENT_ID_LO` | OAuth client ID for Lightning Out |
| `SF_CLIENT_SECRET_LO` | OAuth client secret for Lightning Out |
| `REDIRECT_URI` | OAuth redirect URI for Lightning Out callback |

### Optional

| Variable | Default | Description |
|---|---|---|
| `DISABLE_CLIENT_CREDENTIALS` | — | Set to `true` to disable client credentials flow |
| `DISABLE_WEB_TO_CASE` | — | Set to `true` to disable Web-to-Case route |

## Running Tests

```bash
npm test
```

## Project Structure

```
apiTestToolApp/
├── app.js                    # Express app entry point
├── Procfile                  # Heroku process definition
├── src/
│   ├── config/
│   │   ├── authConfig.js     # OAuth client and auth server definitions
│   │   └── csp.js            # Content Security Policy configuration
│   ├── controllers/          # Request handlers
│   │   ├── authController.js
│   │   ├── apiController.js
│   │   ├── soqlController.js
│   │   ├── lightningOutController.js
│   │   ├── headlessApiController.js
│   │   ├── webToCaseController.js
│   │   ├── chaosController.js
│   │   └── connectivityTestController.js
│   ├── routes/               # Express route definitions
│   ├── services/
│   │   ├── salesforceService.js  # Axios wrapper for Salesforce API calls
│   │   └── chaosService.js
│   └── utils/
│       └── helpers.js        # Shared error handling (handleAxiosError)
├── views/                    # EJS templates
├── public/                   # Static assets
└── __tests__/                # Jest test files
```

## Deployment (Heroku)

The `Procfile` is pre-configured (`web: npm start`). Set environment variables and deploy:

```bash
heroku config:set SESSION_SECRET=<value>
heroku config:set CLIENT_ID=<value>
# ... set all required variables

git push heroku main
```

The app automatically redirects HTTP to HTTPS via the `x-forwarded-proto` header and trusts Heroku's TLS proxy.

## Security

- **CSP** — per-request nonce via Helmet, configured in `src/config/csp.js`
- **CSRF protection** — OAuth state parameter validated on every callback
- **Rate limiting** — SOQL runner: 30 req/15 min; headless reset: 10 req/15 min; connectivity test: 10 req/15 min
- **Session cookies** — `secure: true`, `httpOnly: true`
- **Session regeneration** — session regenerated after OAuth token exchange
