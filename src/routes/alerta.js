let express = require("express")
let router = express.Router()

const alertaController = require("../controllers/alertaController")

router.post("/alertas", function (req, res) {
    alertaController.alertas(req, res);
})

module.exports = router