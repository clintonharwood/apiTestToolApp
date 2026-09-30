const axios = require("axios");
const { z } = require("zod");

// The mock endpoints live on this same app. Agents drive the real HTTP endpoints
// (including their real latency / error / timeout behavior) rather than receiving
// re-hardcoded data, so what an agent sees matches what a browser client would see.
const BASE_URL = process.env.BASE_URL || "http://localhost:3003";

// /v1/all sleeps for 20s before responding, so allow headroom above that.
const SLOW_TIMEOUT = 25000;
// /v1/timeout never responds; bail early so the tool returns a clean result
// instead of hanging the MCP call for the endpoint's full 140s window.
const SHORT_TIMEOUT = 5000;

/**
 * Wraps a value as a successful MCP tool result (single text block of pretty JSON).
 * @param {unknown} payload
 * @returns {{ content: {type: 'text', text: string}[] }}
 */
const ok = (payload) => ({
  content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
});

/**
 * Wraps a value as an MCP tool error result. Callers use this for genuine failures
 * (network errors, timeouts) so the agent can inspect what went wrong.
 * @param {unknown} payload
 * @returns {{ content: {type: 'text', text: string}[], isError: true }}
 */
const fail = (payload) => ({
  content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  isError: true,
});

/**
 * Normalizes an Axios error into a plain object suitable for a tool result.
 * @param {import('axios').AxiosError} err
 */
const describeAxiosError = (err) => {
  if (err.response) {
    // The endpoint responded with a non-2xx status (e.g. /v1/500). This is a
    // "successful" interaction from the agent's perspective — it got a response.
    return { status: err.response.status, body: err.response.data };
  }
  if (err.code === "ECONNABORTED") {
    return { error: "timeout", message: err.message };
  }
  return { error: "request_failed", message: err.message };
};

/**
 * Tool descriptors. Each is transport-agnostic and independently unit-testable:
 * `handler` takes the tool arguments and returns an MCP tool result.
 * @type {{name: string, title: string, description: string, inputSchema: object, handler: Function}[]}
 */
const tools = [
  {
    name: "get_products",
    title: "Get products (slow API)",
    description:
      "Calls GET /v1/all, which simulates a slow upstream API by returning a canned " +
      "product list after a ~20 second delay. Expect this tool to take about 20s to respond.",
    inputSchema: {},
    handler: async () => {
      const res = await axios.get(`${BASE_URL}/v1/all`, { timeout: SLOW_TIMEOUT });
      return ok(res.data);
    },
  },
  {
    name: "trigger_server_error",
    title: "Trigger a 500 error",
    description:
      "Calls GET /v1/500, which always responds with HTTP 500. Used to exercise an " +
      "agent's error-handling. The 500 response body is returned as an error result.",
    inputSchema: {},
    handler: async () => {
      try {
        const res = await axios.get(`${BASE_URL}/v1/500`, { timeout: SHORT_TIMEOUT });
        return ok(res.data);
      } catch (err) {
        return fail(describeAxiosError(err));
      }
    },
  },
  {
    name: "create_record",
    title: "Create a record",
    description:
      "Calls POST /v1/create, which simulates creating a record and returns HTTP 201. " +
      "Any JSON passed in `body` is forwarded as the request payload.",
    inputSchema: {
      body: z
        .record(z.string(), z.any())
        .optional()
        .describe("Optional JSON payload to send as the request body."),
    },
    handler: async ({ body } = {}) => {
      const res = await axios.post(`${BASE_URL}/v1/create`, body || {}, {
        timeout: SHORT_TIMEOUT,
      });
      return ok({ status: res.status, body: res.data });
    },
  },
  {
    name: "test_timeout",
    title: "Test a hanging endpoint",
    description:
      "Calls GET /v1/timeout, an endpoint that never responds. The request is aborted " +
      "after ~5 seconds and a timeout result is returned, letting an agent verify its " +
      "own timeout handling without waiting for the endpoint's full 140s window.",
    inputSchema: {},
    handler: async () => {
      try {
        const res = await axios.get(`${BASE_URL}/v1/timeout`, { timeout: SHORT_TIMEOUT });
        return ok(res.data);
      } catch (err) {
        return fail(describeAxiosError(err));
      }
    },
  },
];

module.exports = { tools, BASE_URL };
