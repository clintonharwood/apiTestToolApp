/**
 * Returns a hardcoded list of products after a 20-second delay, simulating a slow API response.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.getProducts = (req, res) => {
  setTimeout(() => {
    res.json({
      products: [
        { id: 1, title: "Phone", price: 549, stock: 94 },
        { id: 2, title: "Wallet", price: 89, stock: 34 }
      ],
    });
  }, 20000); // 20s delay preserved
};

/**
 * Returns a 500 Internal Server Error response, used to test error handling behaviour.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.serverError = (req, res) => res.status(500).json({ result: "500 error" });

/**
 * Returns a 201 Created response, used to simulate a successful record creation.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.createRecord = (req, res) => res.status(201).json({ result: "Record created" });