var extractor = require('./extractor');
var runner = require('./runner');

function init(){
    extractor.initialize();
}

function run(username){
    runner.perform(username);
}

//if(initialization needed) init();
//else run(username);
