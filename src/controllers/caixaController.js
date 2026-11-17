const e = require("cors");
var caixaModel = require("../models/caixaModel")

function coletar(req, res) {
        caixaModel.coletar()
            .then((resultado)  => {
                    console.log(`\nResultados encontrados: ${resultado.length}`);
                    //console.log(`Resultados: ${JSON.stringify(resultado)}`); // transforma JSON em String
                    if (resultado.length == 0){
                        console.log('dado não encontrado')
                        res.status(403).send("dado não encontrado)");
                    }
                    else{
                        console.log(resultado);
                        res.json(resultado);
                    }
                })
            .catch(
                function (erro) {
                    console.log(erro);
                    console.log("\nHouve um erro ao buscar informações! Erro: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }

module.exports = {
    coletar
}