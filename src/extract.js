var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var url = "unknown"; //can be replaced by any valid MongoDB URL

exports.extractAll = function(){
    MongoClient.connect(url, {useNewUrlParser:true}, function(err,db){
        if(err) throw err;

        //these names could be different
        var dbase = db.db('dbname');
        var collection = dbase.collection('user_with_portfolios');

        var dbase_constants = db.db('db_constants_name');
        var collection1 = dbase_constants.collection('secTypes');
        var collection2 = dbase_constants.collection('countries');

        async.paralell({
            usersWithPortfolios:function(callback){
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
            // Notice that usersWithPortfolios is different with userWithPortfolios 
            var usersWithPortfolios = results.usersWithPortfolios;
            var secTypes = results.secTypes;
            var countries = results.countries;

            usersWithPortfolios.forEach(elem => {
                let user = this.buildUserProfile(elem, secTypes, countries);
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

// used to update a user/add a new user
// should be invoked by the back-end team whenever the userPortfolios is updated.
// @params newuser: if a new user is added
exports.updateOne = function(userPortfolios_id, newuser){
    MongoClient.connect(url, {useNewUrlParser: true}, function(err,db){
        if(err) throw err;

        //these names could be different
        var dbase = db.db('dbname');
        var collection = dbase.collection('user_with_portfolios');

        var dbase_constants = db.db('db_constants_name');
        var collection1 = dbase_constants.collection('secTypes');
        var collection2 = dbase_constants.collection('countries');

        let whereStr = {'_id': userPortfolios_id};

        async.paralell({
            targetUserWithPortfolios:function(callback){
                collection.findOne(whereStr).toArray(callback);
            },
            secTypes:function(callback){
                collection1.find({}).toArray(callback);
            },
            countries:function(callback){
                collection2.find({}).toArray(callback);
            },
        }, function(err,results){
            if(err) throw err;

            var targetUserWithPortfolios = results.targetUserWithPortfolios;
            var secTypes = results.secTypes;
            var countries = results.countries;

            let user = this.buildUserProfile(targetUserWithPortfolios, secTypes, countries);

            var intermediate_dbase = db.db('intermediate_db');
            if(newuser) {
                intermediate_dbase.collection('userProfile').insertOne(user, function(err,res){
                    if(err) throw err;
                    console.log('Inserted id is: '+res.insertedId);
                    db.close();
                });
            }
            else{
                let whereStr1 = {'id':user.id};
                let updateStr = {$set: {'ownedSec': user.ownedSec, 'uservector': user.uservector}};
                intermediate_dbase.collection('userProfile').updateOne(whereStr1, updateStr, function(err,res){
                    if(err) throw err;
                    console.log('updated finished');
                    db.close();
                });
            }
        })
    })
}


// build an user profile like userSample.json
// Notice that usersWithPortfolios is different with userWithPortfolios 
exports.buildUserProfile = function(userWithPortfolios, secTypes, countries){

    var id = userWithPortfolios.user.id;
    var nickname = userWithPortfolios.user.nick;
    var agerange = userWithPortfolios.user.agerange;
    var ownedSec = [];

    //extract from portfolios
    userWithPortfolios.portfolios.forEach(portfolio => {
        var assets = portfolio.assets;

        assets.forEach(security => {
                        
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

        //incremental approach
        typePref[type_idx] += 1;
        countryPref[country_idx] += 1;
        if(risk_idx != -1) riskPref[risk_idx] += 1;
    });

    var uservector = typePref.concat(countryPref).concat(riskPref);

    var user = {
        'id':id,
        'nick':nickname,
        'agerange':agerange,
        'ownedSec':ownedSec,
        'uservector':uservector
    }
    return user;
}