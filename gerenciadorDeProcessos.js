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
        var ciclo = 0, processoExecutando, listaProcessosProntos;

        var filaProcessos = {
            filaTempoReal: [],
            filaUsuario: {
                prioridade1: [],
                prioridade2: [],
                prioridade3: []
            }
        };

        //Enquanto houverem processos a serem executados...
        while(lp.length > 0) {
            line();

            console.log('Ciclo: ' + ciclo);    
            console.log('Lista de processos:\n' + prettyjson.render(lp));
            console.log('Mapa de recursos:\n' + prettyjson.render(mapaRecursos));

            tornaProntosProcessosQueChegaram(lp, filaProcessos);

            line();
            console.log('Fila de processos prontos:\n' + prettyjson.render(filaProcessos));

            /*
             * Caso não existam processos executando, tenta recuperar um processo na lista de processos
             * prontos.
             */
            if (!processoExecutando) {
                console.log('Não há processo em execução');

                /*
                 * Tenta obter uma lista de processos prontos observando a prioridade de cada um
                 */
                listaProcessosProntos = getProcessoProntosOuBloqueados(filaProcessos.filaTempoReal);

                if(listaProcessosProntos.length === 0) {
                    console.log('Não há processos prontos de tempo real, buscando em prioridade 1');
                    listaProcessosProntos = getProcessoProntosOuBloqueados(filaProcessos.filaUsuario.prioridade1);
                }

                if(listaProcessosProntos.length === 0) {
                    console.log('Não há processos prontos com prioridade 1, buscando em prioridade 2');
                    listaProcessosProntos = getProcessoProntosOuBloqueados(filaProcessos.filaUsuario.prioridade2);
                }

                if(listaProcessosProntos.length === 0) {
                    console.log('Não há processos prontos com prioridade 2, buscando em prioridade 3');
                    listaProcessosProntos = getProcessoProntosOuBloqueados(filaProcessos.filaUsuario.prioridade3);
                }

                if (listaProcessosProntos.length > 0) {

                    //Coloca os processos mais velhos na frente da fila
                    listaProcessosProntos = listaProcessosProntos.sort(function(a,b){
                        return a.idade < b.idade;
                    });

                    console.log('Fila com processos prontos encontrada!');
                    //Percorre a lista de processos prontos até o momento que haja um processo executando
                    for (var i = 0; i < listaProcessosProntos.length && !processoExecutando; i++) {

                        console.log('Verificando a disponibilidade dos recursos');
                        if(!listaProcessosProntos[i].recursosAlocados) {
                            console.log('Alocando recursos para processo: ' + listaProcessosProntos[i].pid);
                            var todosRecursosDisponiveis = true;
                            ['impressora', 'scanner', 'modem', 'disco'].forEach(function (recurso){
                                if(listaProcessosProntos[i][recurso] > 0 && !gerenciadorDeRecursos.isRecursoDisponivel(recurso + listaProcessosProntos[i][recurso])) {
                                    console.log('Recurso ' + recurso + ' não disponível para ' + listaProcessosProntos[i].pid);
                                    todosRecursosDisponiveis = false;
                                }
                            });

                            if(todosRecursosDisponiveis) {
                                ['impressora', 'scanner', 'modem', 'disco'].forEach(function (recurso){
                                    if(listaProcessosProntos[i][recurso] > 0) {
                                        gerenciadorDeRecursos.alocarRecurso(recurso + listaProcessosProntos[i][recurso], listaProcessosProntos[i].pid);
                                    }    
                                });
                                listaProcessosProntos[i].recursosAlocados = true;
                                console.log('Recursos alocados para processo: ' + listaProcessosProntos[i].pid);
                            }
                        }

                        if(!listaProcessosProntos[i].memoriaAlocada) {
                            console.log('Alocando memória para processo: ' + listaProcessosProntos[i].pid);
                            if(gerenciadorDeMemoria.alocar(listaProcessosProntos[i])) {
                                console.log('Memória alocada para processo: ' + listaProcessosProntos[i].pid);
                                listaProcessosProntos[i].memoriaAlocada = true;
                            }
                        }

                        if(listaProcessosProntos[i].memoriaAlocada && listaProcessosProntos[i].recursosAlocados) {
                            processoExecutando = listaProcessosProntos[i];
                            processoExecutando.status = ct.STATUS.EXECUTANDO;
                            console.log('dispatcher =>');
                            console.log('\tPID: ' + processoExecutando.pid);
                            console.log('\tidade: ' + processoExecutando.idade);
                            console.log('\tpages: ' + Math.ceil(processoExecutando.blocosEmMemoria / 64));
                            console.log('\tframes: ' + '-');
                            console.log('\tpriority: ' + processoExecutando.prioridade);
                            console.log('\ttime: ' + processoExecutando.tempoProcessador);
                            console.log('\tprinters: ' + processoExecutando.impressora);
                            console.log('\tscanners: ' + processoExecutando.scanner);
                            console.log('\tmodems: ' + processoExecutando.modem);
                            console.log('\tdrives: ' + processoExecutando.disco);

                            console.log('');

                            console.log('process ' + processoExecutando.pid + ' ==>');
                            console.log('P' + processoExecutando.pid + ' STARTED');
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

                    gerenciadorDeRecursos.desalocarRecursoDoProcesso(processoExecutando.pid);
                    processoExecutando = undefined;
                }

                //Envelhece todos os processos que não estão executando se estiverem bloqueados ou prontos
                lp.map(function (processo) {
                    if(!processoExecutando || (processo.pid !== processoExecutando.pid)) {
                        if(processo.status === ct.STATUS.BLOQUEADO || processo.status === ct.STATUS.PRONTO) {
                            processo.idade += 1;
                        }
                    }
                });

                //Como o quantum é 1, bloqueia o processo para que outro seja executado caso não seja um processo de tempo real
                if(processoExecutando && processoExecutando.prioridade !== 0) {
                    processoExecutando.status = ct.STATUS.BLOQUEADO;
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
function tornaProntosProcessosQueChegaram(listaProcessos, filaProcessos) {
    listaProcessos.forEach(function(processo) {
        if(processo.status === ct.STATUS.ESPERANDO && processo.tempoInicializacao === 0) {
            processo.status = ct.STATUS.PRONTO;
            processo.pid = getNextFreePid(listaProcessos);
            alocarProcessoEmFilas(processo, filaProcessos);
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
            idade:              0,
            instrucao:          0,
            status:             ct.STATUS.ESPERANDO,
        };
    });
}

exports._getProcessoPorStatus = getProcessoPorStatus;
function getProcessoPorStatus(listaProcessos, status) {
    return listaProcessos.filter(function (processo) {
        return processo.status === status;
    });
}

exports._getProcessoProntosOuBloqueados = getProcessoProntosOuBloqueados;
function getProcessoProntosOuBloqueados(listaProcessos) {
    return getProcessoPorStatus(listaProcessos, ct.STATUS.PRONTO).concat(getProcessoPorStatus(listaProcessos, ct.STATUS.BLOQUEADO));
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

exports._alocarProcessoEmFilas = alocarProcessoEmFilas;
function alocarProcessoEmFilas(processo, fila) {
    switch(processo.prioridade) {
    case 0:
        fila.filaTempoReal.push(processo);
        break;

    case 1:
        fila.filaUsuario.prioridade1.push(processo);
        break;

    case 2:
        fila.filaUsuario.prioridade2.push(processo);
        break;

    case 3:
        fila.filaUsuario.prioridade3.push(processo);
        break;

    default:
        throw 'Prioridade inválida: ' + processo.prioridade;
    }
}
