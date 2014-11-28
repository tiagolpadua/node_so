'use strict';

var fs = require('fs');
var sget = require('sget');
var ct = require('./constants.js');

/**
 * Module exports.
 */
var exports = module.exports;

var lp, opt;

exports.criarGerenciadorDeProcessos = function (processesFileName, options) {
    var gp = {};

    opt = options;

    gp._listaProcessos = lp = readProcessesFile(processesFileName);

    if(options && options.log) {
        console.log(JSON.stringify(gp._listaProcessos));
    }

    gp.dispatcher = dispatcher;

    return gp;
};

exports._dispatcher = dispatcher;
function dispatcher() {
    var ciclo = 0, processoExecutando, listaProcessosProntos, filaProcessos = {};
    ciclo += 1;
    console.log('Ciclo: ' + ciclo);    

    while(lp.length > 0) {
        tornaProntosProcessosQueChegaram(lp);

        alocarProcessosEmFilas(getProcessoPorStatus(lp, ct.STATUS.PRONTO), filaProcessos);

        /*
         * Caso não existem processos executando, tenta recuperar um processo na lista de processos
         * prontos.
         */
        if (!processoExecutando) {
            console.log('Não há processo em execução');

            /*
             * Tenta obter uma lista de processos prontos observando a prioridade de cada um
             */
            listaProcessosProntos = getProcessoPorStatus(filaProcessos.filaTempoReal, ct.STATUS.PRONTO);

            if(listaProcessosProntos.length === 0) {
                console.log('Não há processos prontos de tempo real, buscando em prioridade 1');
                listaProcessosProntos = getProcessoPorStatus(filaProcessos.filaUsuario.prioridade1, ct.STATUS.PRONTO);
            }

            if(listaProcessosProntos.length === 0) {
                console.log('Não há processos prontos de tempo real, buscando em prioridade 2');
                listaProcessosProntos = getProcessoPorStatus(filaProcessos.filaUsuario.prioridade2, ct.STATUS.PRONTO);
            }

            if(listaProcessosProntos.length === 0) {
                console.log('Não há processos prontos de tempo real, buscando em prioridade 3');
                listaProcessosProntos = getProcessoPorStatus(filaProcessos.filaUsuario.prioridade3, ct.STATUS.PRONTO);
            }

            if (listaProcessosProntos.length > 0) {
                console.log('Fila com processos prontos encontrada!');
                for (i = 0; i < listaProcessosProntos[0] && !processoExecutando; i++) {
                    try {

                        console.log('Verificando a disponibilidade dos recursos');
                        recursos.forEach(function (recurso) {
                            if(listaProcessosProntos[0][recurso] > 0 && gerenciadorDeRecursos.isRecursoDisponivel(recurso, listaProcessosProntos[0][recurso] - 1)) {
                                gerenciadorDeRecursos.alocarRecurso(recurso, listaProcessosProntos[0][recurso] - 1, listaProcessosProntos[0].pid);
                            } else {
                                throw  recurso + ' indisponível: ' + listaProcessosProntos[0][recurso];
                            }
                        });

                        console.log('Recursos alocados, processo será iniciado');

                        processoExecutando = listaProcessosProntos[0];

                        //FIXME: Antes de executar deve alocar a memória
                        processoExecutando.status = STATUS.EXECUTANDO;
                        console.log('dispatcher =>');
                        console.log('\tPID: ' + processoExecutando.pid);
                        console.log('\tpages: ' + '?');
                        console.log('\tframes: ' + '?');
                        console.log('\tpriority: ' + processoExecutando.prioridade);
                        console.log('\ttime: ' + processoExecutando.tempoProcessador);
                        console.log('\tprinters: ' + '?');
                        console.log('\tscanners: ' + '?');
                        console.log('\tmodems: ' + '?');
                        console.log('\tdrives: ' + '?');

                        console.log('');

                        console.log('process ' + processoExecutando.pid + ' ==>');
                        console.log('P' + processoExecutando.pid + ' STARTED');

                    } catch (err) {
                        console.log(err);
                    }
                }
            } else {
                console.log('Não há processos prontos em nenhuma fila...');
            }
        }

        sget().charCodeAt(0);
    }
}

//TODO: testar
/*
 * Verifica se existe algum processo com tempo de inicialização igual a 0 e torna-o pronto;
 */
exports._tornaProntosProcessosQueChegaram = tornaProntosProcessosQueChegaram;
function tornaProntosProcessosQueChegaram(listaProcessos) {
    listaProcessos.forEach(function(processo) {
        if(processo.status === ct.STATUS.ESPERANDO && processo.tempoInicializacao === 0) {
            processo.status = ct.STATUS.PRONTO;
            processo.pid = getNextFreePid(listaProcessos);
            console.log('Processo ' + processo.pid + ' pronto!');
        }
    });
}

//TODO: testar
exports._getNextFreePid = getNextFreePid;
function getNextFreePid(listaProcessos) {
    var nextFreePid = 0;
    listaProcessos.forEach(function(processo) {
        if(processo.pid >= nextFreePid) {
            nextFreePid = processo.pid + 1;
        }
    });
}

exports._readProcessesFile = readProcessesFile;
function readProcessesFile (processesFileName) {
    console.log('Reading processes file: ' + processesFileName);

    if (!fs.existsSync(processesFileName)) {
        throw 'Informed file not exists: ' + processesFileName;
    }

    var lineList = fs.readFileSync(processesFileName, 'utf8').split('\n');

    return lineList.map(function (line) {
        return {
            tempoInicializacao: parseInt(line.split(',')[0], 10),
            prioridade:         parseInt(line.split(',')[1], 10),
            tempoProcessador:   parseInt(line.split(',')[2], 10),
            blocosEmMemoria:    parseInt(line.split(',')[3], 10),
            impressora:         parseInt(line.split(',')[4], 10),
            scanner:            parseInt(line.split(',')[5], 10),
            modem:              parseInt(line.split(',')[6], 10),
            disco:              parseInt(line.split(',')[7], 10),
            instrucao:          0,
            status:             ct.STATUS.ESPERANDO
        };
    });
}

exports._getProcessoPorStatus = getProcessoPorStatus;
function getProcessoPorStatus(listaProcessos, status) {
    return listaProcessos.filter(function (processo) {
        return processo.status === status;
    });
}

exports._isPossuiProcessosExecutando = isPossuiProcessosExecutando;
function isPossuiProcessosExecutando(listaProcessos) {
    return getProcessoPorStatus(listaProcessos, ct.STATUS.EXECUTANDO).length > 0;
}

exports._removerProcessosConcluidos = removerProcessosConcluidos;
function removerProcessosConcluidos(listaProcessos) {
    return listaProcessos.filter(function (processo) {
        return processo.status !== ct.STATUS.CONCLUIDO;
    });
}

exports._alocarProcessosEmFilas = alocarProcessosEmFilas;
function alocarProcessosEmFilas(listaProcessos, fila) {
    fila.filaTempoReal = (fila.filaTempoReal || [])
        .concat( listaProcessos.filter(function(processo) {
            return processo.prioridade === 0;
        })) ;

    fila.filaUsuario = fila.filaUsuario || {};
    fila.filaUsuario.prioridade1 = (fila.filaUsuario.prioridade1 || [])
        .concat(listaProcessos.filter(function(processo) {
            return processo.prioridade === 1;
        }));

    fila.filaUsuario.prioridade1 = (fila.filaUsuario.prioridade1 || [])
    .concat(listaProcessos.filter(function(processo) {
        return processo.prioridade === 2;
    }));

    fila.filaUsuario.prioridade1 = (fila.filaUsuario.prioridade1 || [])
        .concat(listaProcessos.filter(function(processo) {
        return processo.prioridade === 3;
    }));
}