var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var handler = require('./algorithms');
var url = "mongodb://localhost:27017/"; //can be replaced by any valid MongoDB URL


//↑------------------dependencies-------------------↑
//please make sure that all needed packages are installed
//if not, run "npm install <package_name>"


exports.perform = function(username){
//function perform(username){
    
    MongoClient.connect(url, {useNewUrlParser:true}, function(err,db){
        if(err) throw err;
        
        var dbase = db.db('recommender');
        var whereStr = {'username':username};

        async.parallel({
            target:function(callback){
                dbase.collection('userProfile').findOne(whereStr, callback);
            },
            secProfile:function(callback){
                dbase.collection('secProfile').find({}).toArray(callback);
            },

        }, function(err, results){
            if(err) throw err;
            var target = results.target;
            var secProfile = results.secProfile.map(elem => {
                return elem.profile;
            })
            var target_owned = target.ownedSec;
            var target_pref = target.typePref.concat(target.countryPref).concat(target.riskPref);

            var recommendations = handler.topMatch(target_pref, secProfile, target_owned);
            console.log(recommendations);
            recommendations.forEach(function(elem){
                console.log(results.secProfile[elem.key].name);
            })

            db.close();
        });
    });
}