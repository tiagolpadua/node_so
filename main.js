var fs   = require('fs');

var STATUS = {
    CONCLUIDO: 'concluido',
    EXECUTANDO: 'executando',
    PRONTO: 'pronto',
    BLOQUEADO: 'bloqueado'
};

main();

function main() {
    var args = process.argv.slice(2);

    var processesFileName = args[0];

    if (!processesFileName) {
        throw 'No process file informed!';
    }
    var listaProcessos = readProcessesFile(processesFileName);
    console.log('--------------------------------------------');
    console.log('Processess in file: ' + processesList.length);
    console.log(processesList);
    console.log('--------------------------------------------');

    var filaProcessosProntos = {
        filaTempoReal: [],
        filaUsuario: {
            prioridade1: [],
            prioridade2: [],
            prioridade3: []
        }
    };

    var memoriaVirtual = {
        tabelaPagina: [],
        real: {
            tamanhoMaximo: 64,
            memoria: []
        },
        swap: {
            tamanhoMaximo: 64,
            memoria: []
        }
    };

    /**
     * FIXME: Quais processos são de tempo real?
     */

     dispatcher(listaProcessos, filaProcessosProntos, memoriaVirtual);
}

function dispatcher(listaProcessos, filaProcessosProntos, memoriaVirtual) {
    var freePid = 1;
    var listaProcessosExecutando, processoExecutando;
    /*
     * Popula as filas de processos prontos
     * FIXME: Processos só podem estar prontos se tiverem sua memória alocada
     */
    listaProcessos.forEach(function (processo) {
        processo.pid = freePid;
        freePid += 1;
    });

    filaProcessosProntos.filaTempoReal.concat(listaProcessos);

    while(listaProcessos.length > 0){
        if (isPossuiProcessosExecutando(listaProcessos)) {
            listaProcessosExecutando = getProcessoPorStatus(listaProcessos, STATUS.EXECUTANDO);
            
            if(listaProcessosExecutando.length  != 1) {
                throw('Processador não é multi-core, só pode haver um processo executando por vez!!!');
            }
            
            processoExecutando = listaProcessosExecutando[0];
            
            if (processoExecutando.tempoProcessador > 0) {
                processoExecutando.tempoProcessador -= 1;
            }

            if (processoExecutando.tempoProcessador === 0) {
                processo.status = STATUS.CONCLUIDO;
            }
        }

        /*
         * No if anterior algum processo que estava sendo executado pode ter sido concluído
         */
        if (!isPossuiProcessosExecutando(listaProcessos)) {
            ??????
        }

        listaProcessos = removerProcessosProntos(listaProcessos);
    }
}

function getProcessoPorStatus(listaProcessos, status) {
    return listaProcessos.filter(function (processo) {
        return processo.status === status;
    });
}

function isPossuiProcessosExecutando(listaProcessos) {
    return getProcessoPorStatus(listaProcessos, STATUS.EXECUTANDO).length > 0;
}

function removerProcessosProntos(listaProcessos) {
    return listaProcessos.filter(function (processo) {
        return processo.status !== STATUS.CONCLUIDO;
    });
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
            nrCodImpReq:        parseInt(line.split(',')[4], 10),
            reqScanner:         parseInt(line.split(',')[5], 10),
            reqModem:           parseInt(line.split(',')[6], 10),
            nrCodDisco:         parseInt(line.split(',')[7], 10),
            status:             'pronto'
        };
    });
}

/*

process.stdin.on('keypress', function (ch, key) {
    if (key && key.ctrl && key.name == 'd') {
        console.log('ctrl+d detectado');
        process.exit(0);
    }
});

process.stdin.setRawMode(true);
process.stdin.resume();

console.log('node_proxy iniciado, ouvindo porta: ' + port);

if(args.indexOf('-p') !== -1) {
    port = args[args.indexOf('-p') + 1];
}

if(args.indexOf('-b') !== -1) {
    isBlackList = true;
    siteListFileName = args[args.indexOf('-b') + 1];
    console.log('Blacklist ativada, arquivo: ' + siteListFileName);
}

if(args.indexOf('-w') !== -1) {
    isWhiteList = true;
    siteListFileName = args[args.indexOf('-w') + 1];
    console.log('Whitelist ativada, arquivo: ' + siteListFileName);
}

if(isWhiteList && isBlackList) {
    console.log('Opções são mutamente exclusivas: -b/-w');
    process.exit(1);
}

if(isWhiteList || isBlackList) {
    fs.watchFile(siteListFileName, function(c,p) { updateSiteList(); });
}

function updateSiteList() {
  console.log('Atualizando lista de sites');
  siteList = fs.readFileSync(siteListFileName).split('\n');
  console.log(JSON.stringify(siteList));
}


http.createServer(onRequest).listen(port);

function onRequest(clientReq, clientRes) {
    var i, encontrou, msg;
*/
    /*
        Apresentar de forma interativa as seguintes informaçõoes referentes as pelo cliente:
        – Endereço IP de origem (cliente), porta de origem (cliente), URL de destino, IP de destino
          (servidor Web), Porta de Destino (servidor Web), tempo gasto para recuperar a página na Internet;
    */
/*
    console.log('++++++++++++++++++++++++++++++++++++++++++++');
    console.log('IP de origem: ' + getClientIp(clientReq));
    //TODO: completar
    console.log('Porta de origem: ');
    console.log('URL de destino: ' + clientReq.url);
    //TODO: completar
    console.log('IP de destino: ');
    //TODO: completar
    console.log('Porta de destino: ');
    
    //TODO: Remove
    console.log('Method: ' + clientReq.method);

    //TODO: Remove
    console.log('Headers: ' + JSON.stringify(clientReq.headers));

    
    msg = 'Página bloqueada pelo administrador da rede. Favor entrar em contato com administração';

    if(isWhiteList){
        encontrou = false;
        for(i = 0; i < siteList.length; i++) {
            if(clientReq.url.indexOf(siteList[i]) !== -1) {
                encontrou = true;
                break;
            }
        }
        if(!encontrou){            
            console.log(msg);
            clientRes.writeHead(200, {'Content-Type': 'text/plain'});
            clientRes.write(msg);
            clientRes.end();
            console.log('--------------------------------------------');
        }
    }

    if(isBlackList){
        encontrou = false;
        for(i = 0; i < siteList.length; i++) {
            if(clientReq.url.indexOf(siteList[i]) !== -1) {
                encontrou = true;
                break;
            }
        }
        if(encontrou){
            console.log(msg);
            clientRes.writeHead(200, {'Content-Type': 'text/plain'});
            clientRes.write(msg);
            clientRes.end();
            console.log('--------------------------------------------');
        }
    }
    

    var clientUrl = url.parse(clientReq.url);

    var options = {
        hostname: clientUrl.hostname,
        port: clientUrl.port,
        path: clientUrl.path,
        method: clientReq.method
    };
*/
    /*
    var proxy = http.request(options, function (res) {
        res.pipe(clientRes);
    });

    clientReq.pipe(proxy);
    */
/*
    req = http.request(options, function(res) {
        console.log('Got response: ' + res.statusCode);
        clientRes.writeHead(res.statusCode, res.headers);
        res.on('data', function (chunk) {
            clientRes.write(chunk);
        }).on('end', function() {
            clientRes.end();
            console.log('--------------------------------------------');
        });
    });

    req.on('error', function(e) {
        console.log('Got error: ' + e.message);
        clientRes.writeHead(400, {'Content-Type': 'text/plain'});
        clientRes.write(e.message);
        clientRes.end();
        console.log('--------------------------------------------');
    });

    //TODO: Se for POST tem que escrever no request:
    //req.write('data\n');

    req.end();
}

function getClientIp(req) {
    var ipAddress = null;
    var forwardedIpsStr = req.headers['x-forwarded-for'];
    if (forwardedIpsStr) {
        ipAddress = forwardedIpsStr[0];
    }
    if (!ipAddress) {
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
}
*/