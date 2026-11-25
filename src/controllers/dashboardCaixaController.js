var dashboardCaixaModel = require("../models/dashboardCaixaModel");

function buscarMaiorTempoFila(req, res) {
    // Lê o email da URL (?email=...) e remove espaços e deixa em minúsculo
    var email = req.query.email ? String(req.query.email).trim().toLowerCase() : "";

    // Valida o formato básico do email antes de consultar o banco
    var emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
        return res.status(400).json({ mensagem: "Informe um email válido." });
    }

    return dashboardCaixaModel.buscarMaiorTempoFila(email)
        .then(function (ranking) {
            return res.json(ranking);
        })
        .catch(function (erro) {
            console.error("Erro ao buscar caixas com maior tempo em fila cheia:", erro);
            return res.status(500).json({ mensagem: "Não foi possível carregar o ranking de caixas." });
        });
}

module.exports = {
    buscarMaiorTempoFila
};