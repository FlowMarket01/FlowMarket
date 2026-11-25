var database = require("../database/config");

function buscarMaiorTempoFila(email) {
    // Retorna cada caixa do mercado do usuário (identificado pelo email)
    // com o total de minutos em que a fila esteve cheia, do maior para o menor.
    var instrucaoSql = `
        SELECT
            caixa.idCaixa,
            caixa.identificacao,
            CAST(SUM(TIMESTAMPDIFF(MINUTE, estadoFila.inicio, COALESCE(estadoFila.fim, NOW()))) AS UNSIGNED) AS minutosEmCheio
        FROM usuario
        JOIN mercado ON mercado.fk_idUsuario = usuario.idUsuario
        JOIN caixa ON caixa.fk_idMercado = mercado.idMercado
        JOIN estadoFila ON estadoFila.idCaixa = caixa.idCaixa
        WHERE usuario.email = ?
            AND estadoFila.nivel = 'cheio'
        GROUP BY caixa.idCaixa, caixa.identificacao
        ORDER BY minutosEmCheio DESC;
    `;

    return database.executar(instrucaoSql, [email]);
}

module.exports = {
    buscarMaiorTempoFila
};