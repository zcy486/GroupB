const ss = require('./SimilarityService');
const fs = require('./FilteringService');

// Calculates voting-based recommendations
// used for small samples
exports.votingStrategy = (target, users) => {
    let top = [];

    var target_owned = target.ownedSec;
    var filtered_users = fs.filteringForVoting(target, users);
    
    filtered_users.forEach(user =>{
        //votes is a set of securities'isin
        var votes = user.ownedSec;

        votes.forEach(vote => {
            var idx = top.findIndex(function(obj){
                return obj.isin == vote.isin;
            });
            if(idx == -1 && target_owned.findIndex(function(obj){
                return obj.isin == vote.isin;
            }) == -1){
                top.push({'isin': vote.isin, 'counts': 1});
            }
            else if(idx != -1) top[idx].counts++;
        });
    });

    top.sort(function(a,b){
        return b.counts - a.counts;
    });

    top = top.slice(0,5);
    return top;
}

exports.CFBased = function(target, users){
    let topUsers = [];
    let top = [];

    var target_owned = target.ownedSec;
    //filtering part: get 20 most similar users
    users.forEach(user => {
        if(target.id != user.id) topUsers.push({'user':user,'sim':ss.pearson_similarity(target.uservector, user.uservector)});
    });

    topUsers.sort(function(a,b){
        return b.sim - a.sim;
    });

    topUsers.slice(0,20);
    topUsers.map(function(current){
        return current.user;
    });

    //prediction part
    topUsers.forEach(user => {
        
        var ownedSecurities = user.ownedSec;
        var totalquantity = user.totalQuantity;
     
        ownedSecurities.forEach(security => {
            var idx = top.findIndex(function(obj){
                return obj.isin == security.isin;
            });
            var weight = security.quantity/totalquantity;
            if(idx == -1 && target_owned.findIndex(function(obj){
                return obj.isin == security.isin
            }) == -1){
                top.push({'isin': security.isin, 'weights': weight});
            }
            else if(idx != -1) top[idx].weights += weight;
        });
    });

    top.sort(function(a,b){
        return b.weights - a.weights;
    });

    top = top.slice(0,5);
    return top;
};

exports.CFBasedVoting = (target, users, weighted) => {
    let recommendation = [];
    let top_similar_users = fs.filterKMostSimilarUsersSecurityBased(target, users, 20);
    let target_sec = target.ownedSec;

    top_similar_users.forEach(sim_user => {
        let user_sec = sim_user.user.ownedSec;
        let vote_weight = weighted ? sim_user.sim : 1;
        let target_not_owned = fs.targetDoesNotOwn(target_sec, user_sec);

        target_not_owned.forEach(isin => {
            let i = recommendation.findIndex(obj => isin === obj.isin);
            if (i === -1) {
                recommendation.push({'isin' : isin, 'votes' : vote_weight});
            } else {
                recommendation[i].votes += vote_weight;
            }
        });
    });

    recommendation.sort((a, b) => b.votes - a.votes);
    recommendation.slice(0, 5);
    return recommendation;
};
