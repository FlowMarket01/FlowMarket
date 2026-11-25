var dashboardCaixaModel = require("../models/dashboardCaixaModel");

var PERIODOS_VALIDOS = [1, 3, 7, 30];

function validarParametros(req, res) {
    var usuarioId = Number(req.query.usuarioId);
    var dias = req.query.dias === undefined ? 1 : Number(req.query.dias);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        res.status(400).json({ mensagem: "Informe um usuarioId válido." });
        return null;
    }

    if (!Number.isInteger(dias) || PERIODOS_VALIDOS.indexOf(dias) === -1) {
        res.status(400).json({ mensagem: "O período deve ser 1, 3, 7 ou 30 dias." });
        return null;
    }

    return { usuarioId: usuarioId, dias: dias };
}

function buscarDados(req, res) {
    var parametros = validarParametros(req, res);
    if (!parametros) return;

    dashboardCaixaModel.buscarDados(parametros.usuarioId, parametros.dias)
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