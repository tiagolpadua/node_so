// jasmine-node specs --autotest --watch .
'use strict';

var gerenciadorDeProcessos = require("../gerenciadorDeProcessos.js");
var ct = require("../constants.js");
 
describe("Gerenciador de Processos`", function () {
    var gp;

    beforeEach(function() {
        gp = gerenciadorDeProcessos.criarGerenciadorDeProcessos('processes.txt');
    });

    it("Deve criar um gerenciador de processos a partir de um arquivo", function () {
        expect(gp).toBeDefined();
        expect(gp._listaProcessos).toEqual([ { tempoInicializacao : 2, prioridade : 0, tempoProcessador : 3, blocosEmMemoria : 128, impressora : 0, scanner : 0, modem : 0, disco : 0, instrucao : 0, status : 'ESPERANDO' }, { tempoInicializacao : 8, prioridade : 0, tempoProcessador : 2, blocosEmMemoria : 64, impressora : 0, scanner : 0, modem : 0, disco : 0, instrucao : 0, status : 'ESPERANDO' } ]);
    });

    it("Deve pegar os processos por status", function () {
        expect(gerenciadorDeProcessos._getProcessoPorStatus(gp._listaProcessos, ct.STATUS.ESPERANDO)).toEqual([ { tempoInicializacao : 2, prioridade : 0, tempoProcessador : 3, blocosEmMemoria : 128, impressora : 0, scanner : 0, modem : 0, disco : 0, instrucao : 0, status : 'ESPERANDO' }, { tempoInicializacao : 8, prioridade : 0, tempoProcessador : 2, blocosEmMemoria : 64, impressora : 0, scanner : 0, modem : 0, disco : 0, instrucao : 0, status : 'ESPERANDO' } ]);
    });

    it("Deve verificar se existem processos executando", function () {
        expect(gerenciadorDeProcessos._isPossuiProcessosExecutando(gp._listaProcessos)).toBeFalsy();

        gp._listaProcessos[0].status = ct.STATUS.EXECUTANDO;

        expect(gerenciadorDeProcessos._isPossuiProcessosExecutando(gp._listaProcessos)).toBeTruthy();
    });

    it("Deve remover os processos concluídos", function () {
        gp._listaProcessos[0].status = ct.STATUS.CONCLUIDO;
        expect(gerenciadorDeProcessos._removerProcessosConcluidos(gp._listaProcessos)).toEqual([ { tempoInicializacao : 8, prioridade : 0, tempoProcessador : 2, blocosEmMemoria : 64, impressora : 0, scanner : 0, modem : 0, disco : 0, instrucao : 0, status : 'ESPERANDO' } ]);
    });

    it("Deve alocar processos em filas", function () {
        expect(gerenciadorDeProcessos._alocarProcessosEmFilas(gp._listaProcessos)).toEqual({ filaTempoReal : [ { tempoInicializacao : 2, prioridade : 0, tempoProcessador : 3, blocosEmMemoria : 128, impressora : 0, scanner : 0, modem : 0, disco : 0, instrucao : 0, status : 'ESPERANDO' }, { tempoInicializacao : 8, prioridade : 0, tempoProcessador : 2, blocosEmMemoria : 64, impressora : 0, scanner : 0, modem : 0, disco : 0, instrucao : 0, status : 'ESPERANDO' } ], filaUsuario : { prioridade1 : [  ], prioridade2 : [  ], prioridade3 : [  ] } });
    });

    /*

    it("Deve alocar um recurso", function () {
        expect(gerenciadorRecursos.alocarRecurso('impressora', 0, 'P1')).toBeTruthy();
    });

    it("Deve desalocar um recurso", function () {
        gerenciadorRecursos.alocarRecurso('impressora', 0, 'P1');
        expect(gerenciadorRecursos.desalocarRecurso('impressora', 0)).toBeTruthy();
    });

    it("Não deve alocar um recurso já alocado", function () {
        gerenciadorRecursos.alocarRecurso('impressora', 0, 'P1');
        expect(function () {gerenciadorRecursos.alocarRecurso('impressora', 0, 'P1');})
            .toThrow(new Error('Recurso impressora 0 já alocado para P1'));
    });

    it("Não deve desalocar um recurso não alocado", function () {
        expect(function () {gerenciadorRecursos.desalocarRecurso('impressora', 0);})
            .toThrow(new Error('Recurso impressora 0 não está alocado'));
    });
*/
});