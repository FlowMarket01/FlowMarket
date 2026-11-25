var dashboardCaixaModel = require("../models/dashboardCaixaModel");

var PERIODOS_VALIDOS = [1, 3, 7, 30];

function buscarDados(req, res) {
    var usuarioId = Number(req.query.usuarioId);
    var dias = req.query.dias === undefined ? 1 : Number(req.query.dias);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({ mensagem: "Informe um usuarioId válido." });
    }

    // Os períodos permitidos limitam o valor usado na consulta SQL.
    if (!PERIODOS_VALIDOS.includes(dias)) {
        return res.status(400).json({ mensagem: "O período deve ser 1, 3, 7 ou 30 dias." });
    }

    return dashboardCaixaModel.buscarDados(usuarioId, dias)
        .then(function (dados) {
            if (!dados.mercado) {
                return res.status(404).json({ mensagem: "Nenhum mercado encontrado para este usuário." });
            }
            return res.json(dados);
        })
        .catch(function (erro) {
            console.error("Erro ao buscar dados do dashboard de caixas:", erro);
            return res.status(500).json({ mensagem: "Não foi possível carregar os dados do dashboard." });
        });
}

module.exports = {
    buscarDados: buscarDados
};