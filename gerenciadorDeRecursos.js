'use strict';

/**
 * Module exports.
 */
var exports = module.exports;

exports.GerenciadorDeRecursos = GerenciadorDeRecursos;

function GerenciadorDeRecursos(mapaRecursos) {
    var gerenciadorDeRecursos = {};

    gerenciadorDeRecursos.isRecursoDisponivel = function (codigoRecurso) {
        return mapaRecursos[codigoRecurso] === '';
    };

    gerenciadorDeRecursos.alocarRecurso = function (codigoRecurso, processo) {
        if(mapaRecursos[codigoRecurso] !== '') {
            throw 'Recurso: ' + codigoRecurso + ' já alocado para ' + mapaRecursos[codigoRecurso];
        }
        mapaRecursos[codigoRecurso] = processo;

        return true;
    };

    gerenciadorDeRecursos.desalocarRecurso = function (codigoRecurso) {
        if(mapaRecursos[codigoRecurso] === '') {
            throw 'Recurso: ' + codigoRecurso + ' não está alocado';
        }
        mapaRecursos[codigoRecurso] = '';

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