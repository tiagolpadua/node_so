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
    }

    gerenciadorDeMemoria.alocar = function (processo) {
        var paginasNecessarias = Math.ceil(processo.blocosEmMemoria / 64);
        var paginasDisponiveis = paginas.filter(function (pagina) {
            return pagina === -1;
        }).length;

        if(paginasDisponiveis >= paginasNecessarias) {
            for(var i = 0; i < paginas.length && paginasNecessarias > 0; i++) {
                if(paginas[i] === -1) {
                    paginas[i] = processo.pid;
                    paginasNecessarias -= 1;
                }
            }
            return true;
        } else {
            return false;
        }
    };

    gerenciadorDeMemoria.desalocar = function (processo) {
        for(var i = 0; i < paginas.length; i++) {
            if(paginas[i] === processo) {
                paginas[i] = -1;
            }
        }
    };

    return gerenciadorDeMemoria;
}