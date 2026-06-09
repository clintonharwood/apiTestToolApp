const express = require("express");
const { ensureAuthenticated } = require("../middleware/ensureAuthenticated");

const router = express.Router();

router.get("/admin", ensureAuthenticated, (req, res) => {
  res.render("admin", { title: "Admin — Clintox", user: req.user });
});

module.exports = router;
