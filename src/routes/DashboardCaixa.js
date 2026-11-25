var express = require("express");
var router = express.Router();

var dashboardController = require("../controllers/dashboardCaixaController");

// GET /dashboard/caixas/dados?usuarioId=1&dias=1
router.get("/dados", function (req, res) {
    dashboardController.buscarDados(req, res);
});

module.exports = router;