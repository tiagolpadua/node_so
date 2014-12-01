'use strict';

/**
 * Module exports.
 */
var exports = module.exports;

exports.GerenciadorDeMemoria = GerenciadorDeMemoria;

function GerenciadorDeMemoria() {
    var gerenciadorDeMemoria = {};
    var paginas = [];
    for(var i = 0; i < 16; i++) {
        paginas[i] = -1;
    }//seta o valor das paginas com -1 

    gerenciadorDeMemoria.alocar = function (processo) {
        var paginasNecessarias = Math.ceil(processo.blocosEmMemoria / 64);
        var paginasDisponiveis = paginas.filter(function (pagina) {
            return pagina === -1;
        }).length;//verifica as paginas disponiveis que são as com valor -1

        if(paginasDisponiveis >= paginasNecessarias) {
            for(var i = 0; i < paginas.length && paginasNecessarias > 0; i++) {
                if(paginas[i] === -1) {
                    paginas[i] = processo.pid;
                    paginasNecessarias -= 1;
                }
            }//indica o valor do pid no local utilizado no vetor de alocação de paginas
            return true;
        } else {
            return false;
        }//testa o numero de paginas requisitadas com o de paginas disponiveis
    };//Aloca paginas

    gerenciadorDeMemoria.desalocar = function (pid) {
        for(var i = 0; i < paginas.length; i++) {
            if(paginas[i] === pid) {
                paginas[i] = -1;
            }
        }//"seta" o  valor -1 para os indices que estiverem indicados com o numero do processo
    };

    gerenciadorDeMemoria.obterVetorMemoria = function () {
        return paginas;
    };

    return gerenciadorDeMemoria;
}
