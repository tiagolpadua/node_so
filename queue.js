'use strict';

/**
 * Module exports.
 */
var exports = module.exports;

exports.createQueue = function () {
    
    var stac = [];

    return {
        empty: function () {
            return stac.length === 0;
        },

        dequeue: function () {
            return stac.pop();
        },

        enqueue: function(item){
            this.stac.unshift(item);
        }
    };
};