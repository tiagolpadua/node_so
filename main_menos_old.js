(function () {
    'use strict';

    var fs   = require('fs');
    var sget = require('sget');

    var STATUS = {
        ESPERANDO: 'ESPERANDO',
        CONCLUIDO: 'CONCLUIDO',
        EXECUTANDO: 'EXECUTANDO',
        PRONTO: 'PRONTO',
        BLOQUEADO: 'BLOQUEADO'
    };

    function createGerenciadorDeMemoria() {
        var that = this;

        var gerenciadorDeMemoria = {};

        return gerenciadorDeMemoria;
        
    }

    function createGerenciadorDeRecursos() {
        var gerenciadorDeRecursos = {};

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

        gerenciadorDeRecursos.isRecursoDisponivel = function (nomeRecurso, codigoRecurso) {
            return mapaRecursos[nomeRecurso][codigoRecurso].processo === '';
        };

        gerenciadorDeRecursos.alocarRecurso = function (nomeRecurso, codigoRecurso, processo) {
            if(mapaRecursos[nomeRecurso][codigoRecurso].processo !== '') {
                throw 'Recurso ' + nomeRecurso + ' ' + codigoRecurso + ' já alocado para ' + mapaRecursos[nomeRecurso][codigoRecurso];
            }
            mapaRecursos[nomeRecurso][codigoRecurso].processo = processo;
        };

        gerenciadorDeRecursos.desalocarRecurso = function (nomeRecurso, codigoRecurso) {
            if(mapaRecursos[nomeRecurso][codigoRecurso] === '') {
                throw 'Recurso ' + nomeRecurso + ' ' + codigoRecurso + ' não está alocado';
            }
            mapaRecursos[nomeRecurso][codigoRecurso].processo = '';
        };

        return gerenciadorDeRecursos;
    }

    function readProcessesFile(processesFileName) {
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
                status:             STATUS.ESPERANDO
            };
        });
    }

    function getProcessoPorStatus(listaProcessos, status) {
        return listaProcessos.filter(function (processo) {
            return processo.status === status;
        });
    }

    function isPossuiProcessosExecutando(listaProcessos) {
        return getProcessoPorStatus(listaProcessos, STATUS.EXECUTANDO).length > 0;
    }

    function removerProcessosConcluidos(listaProcessos) {
        return listaProcessos.filter(function (processo) {
            return processo.status !== STATUS.CONCLUIDO;
        });
    }

    function alocarProcessosEmFilas(listaProcessos) {
        return {
            filaTempoReal:  listaProcessos.filter(function(processo) {
                                return processo.prioridade === 0;
                            }),
            filaUsuario: {
                prioridade1:    listaProcessos.filter(function(processo) {
                                    return processo.prioridade === 1;
                                }),
                prioridade2:    listaProcessos.filter(function(processo) {
                                    return processo.prioridade === 2;
                                }),
                prioridade3:    listaProcessos.filter(function(processo) {
                                    return processo.prioridade === 3;
                                })
            }
        };
    }

    function despachante(listaProcessos) {

        var gerenciadorDeRecursos = createGerenciadorDeRecursos();

        var filaProcessos = alocarProcessosEmFilas(listaProcessos);
        

        console.log(JSON.stringify(filaProcessos));

        var nextFreePid = 1, i, processoExecutando, listaProcessosProntos, listaProcessosExecutando, listaProcessosEsperando, ciclo = 0;   
        var recursos = ['impressora', 'scanner', 'modem', 'disco'];

        while(listaProcessos.length > 0){
            console.log('Ciclo: ' + ciclo);
            ciclo += 1;

            /*
             * Verifica se existe algum processo com tempo de inicialização igual a 0 e torna-o pronto;
             */
            listaProcessos.forEach(function(processo) {
                if(processo.status === STATUS.ESPERANDO && processo.tempoInicializacao === 0) {
                    processo.status = STATUS.PRONTO;
                    processo.pid = nextFreePid;
                    nextFreePid += 1;

                    console.log('Processo ' + processo.pid + ' pronto!');
                }
            });

            /*
             * Caso não existem processos executando, tenta recuperar um processo na lista de processos
             * prontos.
             */
            if (!processoExecutando) {
                console.log('Não há processo em execução');

                /*
                 * Tenta obter uma lista de processos prontos observando a prioridade de cada um
                 */
                listaProcessosProntos = getProcessoPorStatus(filaProcessos.filaTempoReal, STATUS.PRONTO);

                if(listaProcessosProntos.length === 0) {
                    console.log('Não há processos prontos de tempo real, buscando em prioridade 1');
                    listaProcessosProntos = getProcessoPorStatus(filaProcessos.filaUsuario.prioridade1, STATUS.PRONTO);
                }

                if(listaProcessosProntos.length === 0) {
                    console.log('Não há processos prontos de tempo real, buscando em prioridade 2');
                    listaProcessosProntos = getProcessoPorStatus(filaProcessos.filaUsuario.prioridade2, STATUS.PRONTO);
                }

                if(listaProcessosProntos.length === 0) {
                    console.log('Não há processos prontos de tempo real, buscando em prioridade 3');
                    listaProcessosProntos = getProcessoPorStatus(filaProcessos.filaUsuario.prioridade3, STATUS.PRONTO);
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

            /*
             * Verifica se há um processo executando para reduzir seu tempo de processador
             */
            listaProcessosExecutando =  getProcessoPorStatus(listaProcessos, STATUS.EXECUTANDO);
            if(listaProcessosExecutando.length > 0) {
                console.log('Encontrados processos executando para reduzir o tempo de processamento');
                if(listaProcessosExecutando.length !== 1) {
                    throw "Só pode haver um processo executando por vez...";
                }

                processoExecutando = listaProcessosExecutando[0];
                processoExecutando.tempoProcessador -= 1;

                processoExecutando.instrucao += 1;

                console.log('P' + processoExecutando.pid + ' instruction ' + processoExecutando.instrucao);

                if (processoExecutando.tempoProcessador === 0) {
                    recursos.forEach(function (recurso) {
                        if(processo[recurso] > 0) {
                            console.log('Desalocando ' + recurso + ' ' + processo[recurso]);
                            gerenciadorDeRecursos.desalocarRecurso(recurso, processo[recurso] - 1);
                        }
                    });

                    processoExecutando.status = STATUS.CONCLUIDO;
                    processoExecutando = undefined;
                }

                listaProcessos = removerProcessosConcluidos(listaProcessos);
            } else {
                console.log('Não há processos executando para reduzir o tempo de processamento');
            }

            /*
             * Para todos os processos que estejam esperando, reduz em 1 tick o tempo de espera
             */
            listaProcessosEsperando =  getProcessoPorStatus(listaProcessos, STATUS.ESPERANDO);
            if(listaProcessosEsperando.length > 0) {
                listaProcessosEsperando.map(function (processo) {
                    console.log('Reduzindo tempo de espera para um processo');
                    processo.tempoInicializacao -= 1;
                });
            }

            sget().charCodeAt(0);

        }

        console.log('fim');
    }

    function main() {
        var args = process.argv.slice(2);

        var processesFileName = args[0];

        if (!processesFileName) {
            throw 'No process file informed!';
        }

        var listaProcessos = readProcessesFile(processesFileName);
            console.log('--------------------------------------------');
            console.log('Processess in file: ' + listaProcessos.length);
            console.log(listaProcessos);
            console.log('--------------------------------------------');

        despachante(listaProcessos);
    }

    main();
})();