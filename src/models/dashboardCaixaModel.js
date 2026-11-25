var database = require("../database/config");

function buscarDados(usuarioId, dias) {
    var inicioPeriodo = "DATE_SUB(NOW(), INTERVAL " + dias + " DAY)";
    var mercadoSql = `
        SELECT idMercado AS id, Nome_mercado AS nome
        FROM mercado
        WHERE fk_idUsuario = ?
        LIMIT 1;
    `;
    var resumoSql = `
        SELECT
            COUNT(DISTINCT caixa.idCaixa) AS totalCaixas,
            COUNT(DISTINCT CASE
                WHEN estadoFila.fim IS NULL AND estadoFila.nivel = 'cheio'
                THEN caixa.idCaixa
            END) AS caixasFilaCheiaAgora,
            ROUND(COALESCE(SUM(
                CASE WHEN estadoFila.nivel = 'cheio' THEN
                    GREATEST(TIMESTAMPDIFF(
                        SECOND,
                        GREATEST(estadoFila.inicio, ${inicioPeriodo}),
                        LEAST(COALESCE(estadoFila.fim, NOW()), NOW())
                    ), 0) / 60
                ELSE 0 END
            ), 0), 2) AS minutosFilaCheia
        FROM mercado
        JOIN caixa ON caixa.fk_idMercado = mercado.idMercado
        LEFT JOIN estadoFila
            ON estadoFila.idCaixa = caixa.idCaixa
            AND estadoFila.inicio < NOW()
            AND COALESCE(estadoFila.fim, NOW()) >= ${inicioPeriodo}
        WHERE mercado.fk_idUsuario = ?;
    `;
    var rankingSql = `
        SELECT
            caixa.idCaixa,
            caixa.identificacao,
            ROUND(COALESCE(SUM(
                CASE WHEN estadoFila.nivel = 'cheio' THEN
                    GREATEST(TIMESTAMPDIFF(
                        SECOND,
                        GREATEST(estadoFila.inicio, ${inicioPeriodo}),
                        LEAST(COALESCE(estadoFila.fim, NOW()), NOW())
                    ), 0) / 60
                ELSE 0 END
            ), 0), 2) AS minutosFilaCheia
        FROM mercado
        JOIN caixa ON caixa.fk_idMercado = mercado.idMercado
        LEFT JOIN estadoFila
            ON estadoFila.idCaixa = caixa.idCaixa
            AND estadoFila.inicio < NOW()
            AND COALESCE(estadoFila.fim, NOW()) >= ${inicioPeriodo}
        WHERE mercado.fk_idUsuario = ?
        GROUP BY caixa.idCaixa, caixa.identificacao
        ORDER BY minutosFilaCheia DESC, caixa.idCaixa;
    `;
    var filasAtivasSql = `
        SELECT caixa.idCaixa, caixa.identificacao, estadoFila.nivel, estadoFila.inicio
        FROM mercado
        JOIN caixa ON caixa.fk_idMercado = mercado.idMercado
        JOIN estadoFila ON estadoFila.idCaixa = caixa.idCaixa
        WHERE mercado.fk_idUsuario = ?
            AND estadoFila.fim IS NULL
            AND estadoFila.inicio <= NOW()
        ORDER BY FIELD(estadoFila.nivel, 'cheio', 'moderado', 'leve'), estadoFila.inicio;
    `;
    var historicoSql = `
        SELECT
            caixa.idCaixa,
            caixa.identificacao,
            estadoFila.nivel,
            estadoFila.inicio,
            estadoFila.fim
        FROM mercado
        JOIN caixa ON caixa.fk_idMercado = mercado.idMercado
        JOIN estadoFila ON estadoFila.idCaixa = caixa.idCaixa
        WHERE mercado.fk_idUsuario = ?
            AND estadoFila.inicio < NOW()
            AND COALESCE(estadoFila.fim, NOW()) >= ${inicioPeriodo}
        ORDER BY estadoFila.inicio;
    `;

    // Executa as consultas em paralelo; a posição de cada resultado corresponde
    // à ordem das consultas abaixo.
    return Promise.all([
        database.executar(mercadoSql, [usuarioId]),
        database.executar(resumoSql, [usuarioId]),
        database.executar(rankingSql, [usuarioId]),
        database.executar(filasAtivasSql, [usuarioId]),
        database.executar(historicoSql, [usuarioId])
    ]).then(function (resultados) {
        // Organiza os resultados no formato consumido pela API do dashboard.
        return {
            // Cada consulta SELECT retorna uma lista; a primeira linha contém o mercado.
            mercado: resultados[0][0] || null,
            dias: dias,
            // A consulta agregada pode não retornar linha caso não existam caixas.
            resumo: resultados[1][0] || {
                totalCaixas: 0,
                caixasFilaCheiaAgora: 0,
                minutosFilaCheia: 0
            },
            // Ranking, filas ainda abertas e estados registrados no período.
            ranking: resultados[2],
            filasAtivas: resultados[3],
            historico: resultados[4]
        };
    });
}

module.exports = {
    buscarDados: buscarDados
};
