var express = require("express");
var router = express.Router();

var caixaController = require("../controllers/caixaController")

router.post("/coletar", function (req, res) {
    caixaController.coletar(req, res);
})

module.exports = router;