var database = require("../database/config")

function alertas(id) {
    var instrucaoSql = `
        SELECT * FROM alertas WHERE mercado = ${id};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}


module.exports = {
    alertas
};