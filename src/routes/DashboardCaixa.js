var express = require("express");
var router = express.Router();

var dashboardController = require("../controllers/dashboardCaixaController");

// GET /dashboard/caixas/maior-tempo-fila?email=antonio.cortez@gmail.com
router.get("/maior-tempo-fila", function (req, res) {
    dashboardController.buscarMaiorTempoFila(req, res);
});

module.exports = router;