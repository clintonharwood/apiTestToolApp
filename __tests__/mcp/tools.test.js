const axios = require("axios");
const { tools } = require("../../src/mcp/tools");

jest.mock("axios");

const byName = (name) => tools.find((t) => t.name === name);

/** Parses the JSON text out of a single-block MCP tool result. */
const resultJson = (result) => JSON.parse(result.content[0].text);

describe("MCP mock-API tools", () => {
  beforeEach(() => jest.clearAllMocks());

  test("exposes the four mock-API tools", () => {
    expect(tools.map((t) => t.name).sort()).toEqual([
      "create_record",
      "get_products",
      "test_timeout",
      "trigger_server_error",
    ]);
  });

  describe("get_products", () => {
    test("returns the products payload on success", async () => {
      const products = { products: [{ id: 1, title: "Phone" }] };
      axios.get.mockResolvedValue({ data: products });

      const result = await byName("get_products").handler({});

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/v1\/all$/),
        expect.objectContaining({ timeout: 25000 })
      );
      expect(result.isError).toBeUndefined();
      expect(resultJson(result)).toEqual(products);
    });
  });

  describe("trigger_server_error", () => {
    test("surfaces the 500 response body as an error result", async () => {
      const err = Object.assign(new Error("Request failed with status code 500"), {
        response: { status: 500, data: { result: "500 error" } },
      });
      axios.get.mockRejectedValue(err);

      const result = await byName("trigger_server_error").handler({});

      expect(result.isError).toBe(true);
      expect(resultJson(result)).toEqual({ status: 500, body: { result: "500 error" } });
    });
  });

  describe("create_record", () => {
    test("posts the body and returns the 201 result", async () => {
      axios.post.mockResolvedValue({ status: 201, data: { result: "Record created" } });

      const result = await byName("create_record").handler({ body: { Name: "Acme" } });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/v1\/create$/),
        { Name: "Acme" },
        expect.objectContaining({ timeout: 5000 })
      );
      expect(resultJson(result)).toEqual({ status: 201, body: { result: "Record created" } });
    });

    test("defaults to an empty body when none is provided", async () => {
      axios.post.mockResolvedValue({ status: 201, data: { result: "Record created" } });

      await byName("create_record").handler({});

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        {},
        expect.any(Object)
      );
    });
  });

  describe("test_timeout", () => {
    test("returns a timeout error result when the request is aborted", async () => {
      const err = Object.assign(new Error("timeout of 5000ms exceeded"), {
        code: "ECONNABORTED",
      });
      axios.get.mockRejectedValue(err);

      const result = await byName("test_timeout").handler({});

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/v1\/timeout$/),
        expect.objectContaining({ timeout: 5000 })
      );
      expect(result.isError).toBe(true);
      expect(resultJson(result)).toEqual({
        error: "timeout",
        message: "timeout of 5000ms exceeded",
      });
    });
  });
});
