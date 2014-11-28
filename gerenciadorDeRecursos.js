'use strict';

/**
 * Module exports.
 */
var exports = module.exports;

exports.criarGerenciadorDeRecursos = criarGerenciadorDeRecursos;
function criarGerenciadorDeRecursos(mapaRecursos) {
    var gerenciadorDeRecursos = {};

    gerenciadorDeRecursos.isRecursoDisponivel = function (nomeRecurso, codigoRecurso) {
        return mapaRecursos[nomeRecurso][codigoRecurso].processo === '';
    };

    gerenciadorDeRecursos.alocarRecurso = function (nomeRecurso, codigoRecurso, processo) {
        if(mapaRecursos[nomeRecurso][codigoRecurso].processo !== '') {
            throw 'Recurso ' + nomeRecurso + ' ' + codigoRecurso + ' já alocado para ' + mapaRecursos[nomeRecurso][codigoRecurso].processo;
        }
        mapaRecursos[nomeRecurso][codigoRecurso].processo = processo;

        return true;
    };

    gerenciadorDeRecursos.desalocarRecurso = function (nomeRecurso, codigoRecurso) {
        if(mapaRecursos[nomeRecurso][codigoRecurso].processo === '') {
            throw 'Recurso ' + nomeRecurso + ' ' + codigoRecurso + ' não está alocado';
        }
        mapaRecursos[nomeRecurso][codigoRecurso].processo = '';

        return true;
    };

    return gerenciadorDeRecursos;
}