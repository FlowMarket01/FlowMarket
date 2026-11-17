CREATE OR REPLACE VIEW caixasValidas AS
SELECT
    fk_idCaixa AS idCaixa
FROM sensor
WHERE fk_idCaixa IS NOT NULL
GROUP BY fk_idCaixa
HAVING COUNT(DISTINCT regiao) = 3;

CREATE OR REPLACE VIEW eventos AS
SELECT DISTINCT
    sensor.fk_idCaixa AS idCaixa,
    leituraRegiaoFila.dataLeitura AS momento
FROM leituraRegiaoFila
JOIN sensor
    ON leituraRegiaoFila.fk_idSensor = sensor.idSensor
JOIN caixasValidas
    ON sensor.fk_idCaixa = caixasValidas.idCaixa;
    
CREATE OR REPLACE VIEW estados AS
SELECT
    eventos.idCaixa,
    eventos.momento,

    (
        SELECT l.presenca
        FROM leituraRegiaoFila l
        JOIN sensor s ON l.fk_idSensor = s.idSensor
        WHERE s.fk_idCaixa = eventos.idCaixa
          AND s.regiao = 1
          AND l.dataLeitura <= eventos.momento
        ORDER BY l.dataLeitura DESC, l.idLeitura DESC
        LIMIT 1
    ) AS regiao1,

    (
        SELECT l.presenca
        FROM leituraRegiaoFila l
        JOIN sensor s ON l.fk_idSensor = s.idSensor
        WHERE s.fk_idCaixa = eventos.idCaixa
          AND s.regiao = 2
          AND l.dataLeitura <= eventos.momento
        ORDER BY l.dataLeitura DESC, l.idLeitura DESC
        LIMIT 1
    ) AS regiao2,

    (
        SELECT l.presenca
        FROM leituraRegiaoFila l
        JOIN sensor s ON l.fk_idSensor = s.idSensor
        WHERE s.fk_idCaixa = eventos.idCaixa
          AND s.regiao = 3
          AND l.dataLeitura <= eventos.momento
        ORDER BY l.dataLeitura DESC, l.idLeitura DESC
        LIMIT 1
    ) AS regiao3

FROM eventos;


CREATE OR REPLACE VIEW intervalos AS
SELECT
    idCaixa,
    momento,
    regiao1,
    regiao2,
    regiao3,

    LEAD(momento) OVER (
        PARTITION BY idCaixa
        ORDER BY momento
    ) AS proximaLeitura
FROM estados;


CREATE OR REPLACE VIEW timediff AS
SELECT
    caixa.idCaixa,
    caixa.identificacao,
    SUM(
        CASE
            WHEN intervalos.regiao1 = 1
             AND intervalos.regiao2 = 1
             AND intervalos.regiao3 = 1

            THEN TIMESTAMPDIFF(
                SECOND,
                intervalos.momento,
                intervalos.proximaLeitura
            )
            ELSE 0
        END
    ) / 60 AS minutosPresenca
FROM intervalos
JOIN caixa
    ON intervalos.idCaixa = caixa.idCaixa
WHERE intervalos.proximaLeitura IS NOT NULL
GROUP BY
    caixa.idCaixa,
    caixa.identificacao;
    
SELECT * FROM timediff;

INSERT INTO caixa (fk_idMercado, identificacao)
VALUES (1, 'CAIXA TESTE - FILA CHEIA');

SET @idCaixaTeste = LAST_INSERT_ID();

INSERT INTO sensor
(identificacao, fk_idMercado, fk_idCaixa, fk_idCorredor, regiao)
VALUES
('Sensor Teste - Região 1', 1, @idCaixaTeste, NULL, 1),
('Sensor Teste - Região 2', 1, @idCaixaTeste, NULL, 2),
('Sensor Teste - Região 3', 1, @idCaixaTeste, NULL, 3);


INSERT INTO leituraRegiaoFila
(fk_idSensor, presenca, dataLeitura)
SELECT sensor.idSensor, dados.presenca, dados.dataLeitura
FROM (
    SELECT 'Sensor Teste - Região 1' AS identificacao, 0 AS presenca, '2026-11-18 08:00:00' AS dataLeitura
    UNION ALL
    SELECT 'Sensor Teste - Região 2', 0, '2026-11-18 08:00:00'
    UNION ALL
    SELECT 'Sensor Teste - Região 3', 0, '2026-11-18 08:00:00'

    UNION ALL
    SELECT 'Sensor Teste - Região 1', 1, '2026-11-18 08:05:00'
    UNION ALL
    SELECT 'Sensor Teste - Região 2', 1, '2026-11-18 08:10:00'
    UNION ALL
    SELECT 'Sensor Teste - Região 3', 1, '2026-11-18 08:15:00'

    UNION ALL
    SELECT 'Sensor Teste - Região 2', 0, '2026-11-18 08:25:00'
    UNION ALL
    SELECT 'Sensor Teste - Região 1', 0, '2026-11-18 08:30:00'
    UNION ALL
    SELECT 'Sensor Teste - Região 3', 0, '2026-11-18 08:35:00'
) AS dados
JOIN sensor
    ON sensor.identificacao = dados.identificacao
WHERE sensor.fk_idCaixa = @idCaixaTeste;


SELECT
    sensor.identificacao,
    leituraRegiaoFila.presenca,
    leituraRegiaoFila.dataLeitura
FROM leituraRegiaoFila
JOIN sensor
    ON leituraRegiaoFila.fk_idSensor = sensor.idSensor
WHERE sensor.fk_idCaixa = @idCaixaTeste
ORDER BY leituraRegiaoFila.dataLeitura;

SELECT * FROM timediff;
SELECT caixa.idCaixa FROM caixa WHERE fk_idMercado = 1;
-- SELECT caixa.id_caixa FROM caixa WHERE fk_caixa_mercado = 1;

SELECT * FROM timediff WHERE (idCaixa) IN(SELECT caixa.idCaixa FROM caixa WHERE fk_idMercado = 1);


