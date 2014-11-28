'use strict';

var sget = require('sget');
var ct = require('./constants.js');
var gp = require('./gerenciadorDeProcessos.js');
var gr = require('./gerenciadorDeRecursos.js');

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