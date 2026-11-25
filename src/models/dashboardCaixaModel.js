var database = require("../database/config");

async function buscarDados(usuarioId, dias) {
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

    // O await espera cada consulta terminar antes de iniciar a próxima.
    var mercado = await database.executar(mercadoSql, [usuarioId]);
    var resumo = await database.executar(resumoSql, [usuarioId]);
    var ranking = await database.executar(rankingSql, [usuarioId]);
    var filasAtivas = await database.executar(filasAtivasSql, [usuarioId]);
    var historico = await database.executar(historicoSql, [usuarioId]);

    // Organiza os resultados no formato consumido pela API do dashboard.
    return {
        mercado: mercado[0] || null,
        dias: dias,
        resumo: resumo[0] || {
            totalCaixas: 0,
            caixasFilaCheiaAgora: 0,
            minutosFilaCheia: 0
        },
        ranking: ranking,
        filasAtivas: filasAtivas,
        historico: historico
    };
}

module.exports = {
    buscarDados: buscarDados
};
