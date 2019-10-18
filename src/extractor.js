var fs = require('fs');
var async = require('async');
var parse = require('csv-parse');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/"; //can be replaced by any valid MongoDB URL

//↑------------------dependencies-------------------↑
//please make sure that all needed packages are installed
//if not, run "npm install <package_name>"

var securities = [];
var secTypes = [];
var countries = [];

var csvData = [];

//read from CSV and save all the intermediate data in a mongoDB database.
//-----please make sure that your csv file is in the same directory-----
exports.initialize = function(){
//function initialize(){
    fs.createReadStream('./user30d.csv')
        .pipe(parse({
                    skip_lines_with_error:true, 
                    skip_lines_with_empty_values:true
                    }))
        .on('data', function(csvrow) {
            //do something with csvrow
            var row = csvrow.slice(0,5);
            csvData.push(row);        
        })
        .on('end',function() {
        
        console.log('reading from CSV finished');
        //extract all the securities, security types and countries.
        const {securities, secTypes, countries} = extract();
        console.log('extracting finished');

        console.log('number of securities: '+securities.length);
        console.log('number of security types: '+secTypes.length);
        console.log('number of countries: '+countries.length);
        const rawData = {securities, secTypes, countries};
        
        const {secProfile, userProfile} = prepareData(rawData);
        console.log('Profiles preparing finished');
        
        //return new Promise(
        //save all the intermediate data in a mongoDB database.
        MongoClient.connect(url, {useNewUrlParser: true}, function(err, db){
            if(err) throw err;
            var dbase = db.db('recommender');

            
            async.parallel({
                one:function(callback){
                    dbase.collection('secTypes').insertMany(secTypes, callback);
                },
                two:function(callback){
                dbase.collection('countries').insertMany(countries, callback);
                },
                three:function(callback){
                dbase.collection('secProfile').insertMany(secProfile, callback);
                },
                four: function(callback){
                dbase.collection('userProfile').insertMany(userProfile, callback);
                },
            }, function(err, res){
                if(err) throw err;
                console.log('Insertions are done.');
                db.close();
            });
        });
    });
}

//This function is used for extracting all the securities, security types and countries.
function extract(){
    csvData.forEach((elem) => {

        //get all secTypes
        if(secTypes.findIndex(function(obj){
            return obj.type == elem[1];
        })=== -1){
            var riskClass = getRiskClass(elem[1]);
            secTypes.push({'type':elem[1], 'risklevel':riskClass});
        }

        var sec_isin = elem[3];
        //get all countries
        var country_id = sec_isin.slice(0,2);
        if(countries.findIndex(function(obj){
            return obj.id == country_id;
        })=== -1){
            countries.push({'id':country_id});
        }

        //get all securities
        if(securities.findIndex(function(obj){
            return obj.isin == sec_isin; 
        })=== -1){
            securities.push({'isin':sec_isin, 'name':elem[4], 'type':elem[1], 'country':country_id});
        }

    });
    return {securities, secTypes, countries};
}

//risk level => low:0, medium:1, high:2
function getRiskClass(sec_type){
    if(sec_type == 'FND'||sec_type == 'KNO'||sec_type == 'ETC'||sec_type == 'BND'||sec_type == 'OPT'||sec_type == 'RES'||sec_type == 'WNT') return 0;
    else if(sec_type == 'STK'||sec_type == 'ETF'||sec_type == 'ZER'||sec_type == 'CUR'||sec_type == 'ETN') return 1;
    else if(sec_type == 'CRYP'||sec_type == 'FUT') return 2;
    else if(sec_type == 'INT'||sec_type == 'IND') return -1;
}

//This function is used for building userProfile && secProfile
function prepareData(rawData){
    const secProfile = [];
    const userProfile = [];
    
    const {securities, secTypes, countries} = rawData;

    //build secProfile
    securities.forEach(function(security){
        const typeArr = [];
        const countryArr = [];
        const riskLevel = [0,0,0];

        const isin = security.isin;
        const name = security.name;
        const type = security.type;
        var risk_idx = -1;
        
        secTypes.forEach(elem => {
            typeArr.push(type == elem.type? 1:0);
            if(type == elem.type){
                risk_idx = elem.risklevel;
            }
        });

        countries.forEach(elem =>{
            countryArr.push(security.country == elem.id? 1:0);
        })
        if(risk_idx != -1) riskLevel[risk_idx] += 1;

        secProfile.push({'isin':isin, 'name':name, 'type':type, 'profile':typeArr.concat(countryArr).concat(riskLevel)});
    });
    

    //build userProfile
    csvData.forEach(line => {
        const secIdx = securities.findIndex(function(elem){
            return elem.isin == line[3];
        })

        let user = userProfile.find(function(elem){
            return elem.username == line[0];
        });

        if(!user){
            user = {
                'username': line[0], 
                'typePref': secTypes.map(x => 0),
                'countryPref': countries.map(x => 0),
                'riskPref': [0,0,0],
                'ownedSec': [],
            }
            userProfile.push(user);
        }
        
        const sec = securities[secIdx];
        const type_idx = secTypes.findIndex(function(elem){
            return elem.type == sec.type;
        });
        const country_idx = countries.findIndex(function(elem){
            return elem.id == sec.country;
        });
        const risk_idx = secTypes[type_idx].risklevel;

        user.ownedSec.push(secIdx); //record the user's owned securities
        user.typePref[type_idx] += 1; //cumulate the user's type preferences
        user.countryPref[country_idx] += 1; //cumulate the user's country preferences
        if(risk_idx != -1) user.riskPref[risk_idx] += 1;
    });


    return {secProfile, userProfile};

}