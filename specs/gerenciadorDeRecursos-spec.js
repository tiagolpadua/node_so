// jasmine-node specs --autotest --watch .
'use strict';

var gerenciadorDeRecursos = require("../gerenciadorDeRecursos.js");
 
describe("Gerenciador de Recursos", function () {
    var gc;

    beforeEach(function() {
        var mapaRecursos = {
            scanner:
            [{
                processo: ''
            }],
            impressora:
            [{
                processo: ''
            },{
                processo: ''
            }],
            modem:
            [{
                processo: ''
            }],
            disco:
            [{
                processo: ''
            },{
                processo: ''
            }]
        };
        gc = gerenciadorDeRecursos.criarGerenciadorDeRecursos(mapaRecursos);
    });

    it("Deve criar um gerenciador de recursos", function () {
        expect(gc).toBeDefined();
    });

    it("Deve verificar se um recurso está disponível", function () {
        expect(gc.isRecursoDisponivel('impressora', 0)).toBeTruthy();
    });

    it("Deve alocar um recurso", function () {
        expect(gc.alocarRecurso('impressora', 0, 'P1')).toBeTruthy();
    });

    it("Deve desalocar um recurso", function () {
        gc.alocarRecurso('impressora', 0, 'P1');
        expect(gc.desalocarRecurso('impressora', 0)).toBeTruthy();
    });

    it("Não deve alocar um recurso já alocado", function () {
        gc.alocarRecurso('impressora', 0, 'P1');
        expect(function () {gc.alocarRecurso('impressora', 0, 'P1');})
            .toThrow(new Error('Recurso impressora 0 já alocado para P1'));
    });

    it("Não deve desalocar um recurso não alocado", function () {
        expect(function () {gc.desalocarRecurso('impressora', 0);})
            .toThrow(new Error('Recurso impressora 0 não está alocado'));
    });
});