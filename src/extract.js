var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var url = "unknown"; //can be replaced by any valid MongoDB URL

exports.extract = function(){
    MongoClient.connect(url, {useNewUrlParser:true}, function(err,db){
        if(err) throw err;

        //these names could be different
        var dbase = db.db('dbname');
        var collection = dbase.collection('user_portfolios');

        var dbase_constants = db.db('db_constants_name');
        var collection1 = dbase_constants.collection('secTypes');
        var collection2 = dbase_constants.collection('countries');

        async.paralell({
            portfolios:function(callback){
                collection.find({}).toArray(callback);
            },
            secTypes:function(callback){
                collection1.find({}).toArray(callback);
            },
            countries:function(callback){
                collection2.find({}).toArray(callback);
            },
        }, function(err,results){
            if(err) throw err;

            var userProfile = [];
            var secTypes = results.secTypes;
            var countries = results.countries;

            //build userProfile for recommendations
            results.portfolios.forEach(elem => {
                var id = elem.user.id;
                var nickname = elem.user.nick;
                var agerange = elem.user.agerange;
                var ownedSec = [];
                var totalOwnedQuantity = 0;

                //extract from portfolios
                elem.portfolios.forEach(portfolio => {
                    var assets = portfolio.assets;

                    assets.forEach(security => {
                        totalOwnedQuantity += security.quantity;
                        var idx = ownedSec.findIndex(function(obj){
                            return obj.isin = security.isin;
                        });
                        if(idx == -1){
                            ownedSec.push({'isin':security.isin,
                                           'name':security.name,
                                           'quantity':security.quantity,
                                           'type':security.type});
                        }
                        else ownedSec[idx].quantity += security.quantity;
                    });
                });

                //build user vectors
                var typePref = secTypes.map(x => 0);
                var countryPref = countries.map(x => 0);
                var riskPref = [0,0,0];
                ownedSec.forEach(security => {
                    const type_idx = secTypes.findIndex(function(elem){
                        return elem.type == security.type;
                    });
                    const country_idx = countries.findIndex(function(elem){
                        return elem.id == security.isin.slice(0,2);
                    });
                    const risk_idx = secTypes[type_idx].risklevel;

                    //we use weight to represent the user's preferences instead of 1
                    var weight = security.quantity/totalOwnedQuantity;
                    typePref[type_idx] += weight;
                    countryPref[country_idx] += weight;
                    if(risk_idx != -1) riskPref[risk_idx] += weight;
                });

                var uservector = typePref.concat(countryPref).concat(riskPref);

                var user = {
                    'id':id,
                    'nick':nickname,
                    'agerange':agerange,
                    'ownedSec':ownedSec,
                    'totalQuantity':totalOwnedQuantity,
                    'uservector':uservector
                }
                userProfile.push(user);
            });

            //create the intermediate database and insert the userProfile
            var intermediate_dbase = db.db('intermediate_db');
            intermediate_dbase.collection('userProfile').insertMany(userProfile, function(err,res){
                if(err) throw err;

                console.log('InsertedCount: '+res.insertedCount);
                db.close();
            });
        });
    });
}

exports.update = function(todo){
    //TODO
}