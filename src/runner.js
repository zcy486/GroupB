const rs = require('./services/RecommendationService');
const async = require('async');
const MongoClient = require('mongodb').MongoClient;
const url = "unknown"; //can be replaced by any valid MongoDB URL


//↑------------------dependencies-------------------↑
//please make sure that all needed packages are installed
//if not, run "npm install <package_name>"


exports.perform = function(target_user_id){
    
    MongoClient.connect(url, {useNewUrlParser:true}, function(err,db){
        if(err) throw err;
        
        var dbase = db.db('intermediate_db');
        var whereStr = {'id':target_user_id};

        async.parallel({
            target:function(callback){
                dbase.collection('userProfile').findOne(whereStr, callback);
            },
            users:function(callback){
                dbase.collection('userProfile').find({}).toArray(callback);
            },

        }, function(err, results){
            if(err) throw err;
            var target = results.target;
            var users = results.users;

            var target_owned = target.ownedSec;

            var recommendations = [];
            //small samples
            if(target_owned.length < 30){
                recommendations = rs.voting(target, users);
            }
            //big samples
            else{
                recommendations = rs.cfBasedVoting(target, users);
            }
            
            console.log(recommendations);
            //recommendations.forEach(function(elem){
            //    console.log(elem.isin);
            //});

            db.close();
            return recommendations;
        });
    });
};