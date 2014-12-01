'use strict';

/**
 * Module exports.
 */
var exports = module.exports;

exports.GerenciadorDeRecursos = GerenciadorDeRecursos;

function GerenciadorDeRecursos(mapaRecursos) {
    var gerenciadorDeRecursos = {};

    gerenciadorDeRecursos.isRecursoDisponivel = function (codigoRecurso) {
        var ret = mapaRecursos[codigoRecurso] === '';
        if(!ret) {
            console.log('Recurso ' +  codigoRecurso + ' não está disponível');
        }
        return ret;
    };

    gerenciadorDeRecursos.alocarRecurso = function (codigoRecurso, processo) {
        console.log('Alocando recurso: ' + codigoRecurso + ' para processo.pid = ' + processo);
        if(mapaRecursos[codigoRecurso] !== '') {
            throw 'Recurso: ' + codigoRecurso + ' já alocado para ' + mapaRecursos[codigoRecurso];
        }
        mapaRecursos[codigoRecurso] = processo;

        return true;
    };

    gerenciadorDeRecursos.desalocarRecursoDoProcesso = function (codigoProcesso) {
        for (var recurso in mapaRecursos) {
            if (mapaRecursos.hasOwnProperty(recurso)) {
                if(mapaRecursos[recurso] === codigoProcesso) {
                    mapaRecursos[recurso] = '';
                }
            }
        }
    };

    return gerenciadorDeRecursos;
}