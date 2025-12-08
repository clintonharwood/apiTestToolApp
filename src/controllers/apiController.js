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

exports.serverError = (req, res) => res.status(500).json({ result: "500 error" });
exports.createRecord = (req, res) => res.status(201).json({ result: "Record created" });