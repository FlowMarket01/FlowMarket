let express = require("express")
const { createTicket } = require("../controllers/serviceDesk")
let router = express.Router()

router.post("/", function(req, res){
    createTicket(req, res)
})

module.exports = router