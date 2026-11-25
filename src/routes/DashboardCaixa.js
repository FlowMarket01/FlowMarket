var express = require("express");
var router = express.Router();

var dashboardController = require("../controllers/dashboardCaixaController");

router.get("/dados", function (req, res) {
    dashboardController.buscarDados(req, res);
});

module.exports = router;