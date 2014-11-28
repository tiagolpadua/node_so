'use strict';

var gp = require('./gerenciadorDeProcessos.js');

/**
 * Module exports.
 */
var exports = module.exports;

exports.run = function() {
    console.log('run!');
    var args = process.argv.slice(2);

    var processesFileName = args[0];

    if (!processesFileName) {
        throw 'No process file informed!';
    }

    var gerenciadorDeProcessos = gp.GerenciadorDeProcessos(processesFileName, {log: true});

    gerenciadorDeProcessos.dispatcher();
};