'use strict';

var fs = require('fs');
var sget = require('sget');
var ct = require('./constants.js');
var prettyjson = require('prettyjson');

var gr = require('./gerenciadorDeRecursos.js');
var gm = require('./gerenciadorDeMemoria.js');

/**
 * Module exports.
 */
var exports = module.exports;

exports.GerenciadorDeProcessos = GerenciadorDeProcessos;

function GerenciadorDeProcessos (processesFileName) {
    var lp = readProcessesFile(processesFileName);

    var gerenciadorDeProcessos = {};

    var mapaRecursos = {
            scanner1:  '',
            impressora1: '',
            impressora2: '',
            modem1: '',
            disco1: '',
            disco2: ''
        };

    var gerenciadorDeRecursos = gr.GerenciadorDeRecursos(mapaRecursos);

    var gerenciadorDeMemoria = gm.GerenciadorDeMemoria();

    function line() {
        console.log('-----------------------------------------------');
    }

    gerenciadorDeProcessos.dispatcher = function () {
        var ciclo = 0, processoExecutando, listaProcessosProntos, filaProcessos = {};

        //Enquanto houverem processos a serem executados...
        while(lp.length > 0) {
            line();

            console.log('Ciclo: ' + ciclo);    
            console.log('Lista de processos: ' + prettyjson.render(lp));

            tornaProntosProcessosQueChegaram(lp);

            alocarProcessosEmFilas(getProcessoPorStatus(lp, ct.STATUS.PRONTO), filaProcessos);
            line();
            console.log('Fila de processos prontos: ' + prettyjson.render(filaProcessos));

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
                    console.log('Não há processos prontos com prioridade 1, buscando em prioridade 2');
                    listaProcessosProntos = getProcessoPorStatus(filaProcessos.filaUsuario.prioridade2, ct.STATUS.PRONTO);
                }

                if(listaProcessosProntos.length === 0) {
                    console.log('Não há processos prontos com prioridade 2, buscando em prioridade 3');
                    listaProcessosProntos = getProcessoPorStatus(filaProcessos.filaUsuario.prioridade3, ct.STATUS.PRONTO);
                }

                if (listaProcessosProntos.length > 0) {
                    console.log('Fila com processos prontos encontrada!');
                    for (var i = 0; i < listaProcessosProntos.length && !processoExecutando; i++) {
                        try {

                            console.log('Verificando a disponibilidade dos recursos');
                            for(var j = 0; j < listaProcessosProntos.length && !processoExecutando; j++) {
                                var todosRecursosDisponiveis = true;
                                if(listaProcessosProntos[j].impressora > 0 && !gerenciadorDeRecursos.isRecursoDisponivel['impressora' + listaProcessosProntos[j].impressora]) {
                                    todosRecursosDisponiveis = false;
                                }

                                if(listaProcessosProntos[j].scanner > 0 && !gerenciadorDeRecursos.isRecursoDisponivel['scanner' + listaProcessosProntos[j].scanner]) {
                                    todosRecursosDisponiveis = false;
                                }

                                if(listaProcessosProntos[j].modem > 0 && !gerenciadorDeRecursos.isRecursoDisponivel['modem' + listaProcessosProntos[j].modem]) {
                                    todosRecursosDisponiveis = false;
                                }

                                if(listaProcessosProntos[j].disco > 0 && !gerenciadorDeRecursos.isRecursoDisponivel['disco' + listaProcessosProntos[j].disco]) {
                                    todosRecursosDisponiveis = false;
                                }

                                if(todosRecursosDisponiveis) {
                                    console.log('Recursos alocados, processo será iniciado');
                                    processoExecutando = listaProcessosProntos[0];
                                    if(listaProcessosProntos[j].impressora > 0) {
                                        gerenciadorDeRecursos.alocarRecurso('impressora' + listaProcessosProntos[j].impressora, processoExecutando.pid);
                                    }

                                    if(listaProcessosProntos[j].scanner > 0) {
                                        gerenciadorDeRecursos.alocarRecurso('scanner' + listaProcessosProntos[j].scanner, processoExecutando.pid);
                                    }

                                    if(listaProcessosProntos[j].modem > 0) {
                                        gerenciadorDeRecursos.alocarRecurso('modem' + listaProcessosProntos[j].modem, processoExecutando.pid);
                                    }

                                    if(listaProcessosProntos[j].disco > 0) {
                                        gerenciadorDeRecursos.alocarRecurso('disco' + listaProcessosProntos[j].disco, processoExecutando.pid);
                                    }

                                }
                            }

                            //FIXME: Antes de executar deve alocar a memória
                            processoExecutando.status = ct.STATUS.EXECUTANDO;
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
            } else {
                console.log('Há processo em execução');
                console.log('Reduzindo tempo de processamento para processo em execução');
                processoExecutando.tempoProcessador -= 1;

                //Se o processo zerar o tempo de processador, foi encerrado, então é removido da lista de processos
                if(processoExecutando.tempoProcessador === 0) {
                    lp = lp.filter(function (processo) {
                        return processo.pid !== processoExecutando.pid;
                    });      

                    filaProcessos.filaTempoReal = filaProcessos.filaTempoReal.filter(function (processo) {
                        return processo.pid !== processoExecutando.pid;
                    });

                    filaProcessos.filaUsuario.prioridade1 = filaProcessos.filaUsuario.prioridade1.filter(function (processo) {
                        return processo.pid !== processoExecutando.pid;
                    });

                    filaProcessos.filaUsuario.prioridade2 = filaProcessos.filaUsuario.prioridade2.filter(function (processo) {
                        return processo.pid !== processoExecutando.pid;
                    });

                    filaProcessos.filaUsuario.prioridade3 = filaProcessos.filaUsuario.prioridade3.filter(function (processo) {
                        return processo.pid !== processoExecutando.pid;
                    });

                    gerenciadorDeRecursos.desalocarRecursoDoProcesso(processo.pid);
                    processoExecutando = undefined;
                }


            }

            console.log('Reduzindo tempo de espera para processos que não inicializaram');
            lp.map(function (processo) {
                if(processo.tempoInicializacao > 0) {
                    processo.tempoInicializacao -= 1;
                }
            });

            console.log('Fim do ciclo: ' + ciclo + ' pressione uma tecla para continuar');
            sget().charCodeAt(0);

            ciclo += 1;
        }
    };

    return gerenciadorDeProcessos;
}

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

exports._getNextFreePid = getNextFreePid;
function getNextFreePid(listaProcessos) {
    var nextFreePid = 0;
    listaProcessos.forEach(function(processo) {
        if(processo.pid >= nextFreePid) {
            nextFreePid = processo.pid + 1;
        }
    });
    return nextFreePid;
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

    fila.filaUsuario.prioridade2 = (fila.filaUsuario.prioridade2 || [])
    .concat(listaProcessos.filter(function(processo) {
        return processo.prioridade === 2;
    }));

    fila.filaUsuario.prioridade3 = (fila.filaUsuario.prioridade3 || [])
        .concat(listaProcessos.filter(function(processo) {
        return processo.prioridade === 3;
    }));
}