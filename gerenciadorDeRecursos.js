'use strict';

/**
 * Module exports.
 */
var exports = module.exports;

exports.GerenciadorDeRecursos = GerenciadorDeRecursos;

function GerenciadorDeRecursos(mapaRecursos) {
    var gerenciadorDeRecursos = {};
    
    //função de verificação de disponibilidade de recursos
    gerenciadorDeRecursos.isRecursoDisponivel = function (codigoRecurso) {
        var ret = mapaRecursos[codigoRecurso] === '';
        if(!ret) {
            console.log('Recurso ' +  codigoRecurso + ' não está disponível');
        }//verifica se o recurso não está alocado. Caso esteja, emite o log
        return ret;
    };

    //função de alocação de recursos
    gerenciadorDeRecursos.alocarRecurso = function (codigoRecurso, processo) {
        console.log('Alocando recurso: ' + codigoRecurso + ' para processo.pid = ' + processo);
        if(mapaRecursos[codigoRecurso] !== '') {
            throw 'Recurso: ' + codigoRecurso + ' já alocado para ' + mapaRecursos[codigoRecurso];
        }//verifica se o recurso está alocado para outro processo
        mapaRecursos[codigoRecurso] = processo; // aloca ao processo requisitante o recurso

        return true;
    };

    gerenciadorDeRecursos.desalocarRecursoDoProcesso = function (codigoProcesso) {
        for (var recurso in mapaRecursos) {
            if (mapaRecursos.hasOwnProperty(recurso)) {
                if(mapaRecursos[recurso] === codigoProcesso) {
                    mapaRecursos[recurso] = '';//desaloca o recurso
                }
            }
        }
    };

    return gerenciadorDeRecursos;
}
