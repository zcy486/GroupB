var extractor = require('./extract');
var runner = require('./runner');

function init(){
    extractor.extractAll();
}

function run(target_userid){
    var recommendations = runner.perform(target_userid);
}

//if(initialization needed) init();
//else run(username);
