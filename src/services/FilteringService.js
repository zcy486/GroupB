const ss = require('./SimilarityService');

//on condition that we have information of user's age range
//filter the users first by age range, then by the target user's owned securities
exports.filteringForVoting = function(target, users){
    var filter_by_agerange = users.filter(user => user.agerange == target.agerange);
    var filter_by_target_owned = filter_by_agerange.filter(user => function isSubset(){
        if(target.ownedSec.length > user.ownedSec.length) return false;
        target.ownedSec.forEach(elem => {
            if(user.ownedSec.findIndex(function(obj){
                return elem.isin == obj.isin;
            }) == -1) return false;
        })
        return true;
    });
    return filter_by_target_owned;
};

exports.securityIntersection = (sec1, sec2) => {
    let s1 = [];
    let s2 = [];
    sec1.forEach(sec => {
        s1.push(sec.isin);
    });
    sec2.forEach(sec => {
        s2.push(sec.isin);
    });

    return s1.filter(sec => b.has(sec));
};

exports.filterKMostSimilarUsersSecurityBased = (target, users, k) => {
    let similarity_score = [];
    let target_sec = target.ownedSec;
    users.forEach(user => {
        let user_sec = user.ownedSec;
        let intersection = this.securityIntersection(target_sec, user_sec);
        let target_amounts = [];
        let user_amounts = [];
        intersection.forEach(i_isin => {
            target_sec.forEach(sec => {
                if (sec.isin === i_isin) target_amounts.push(sec.quantity);
            });
            user_sec.forEach(sec => {
                if (sec.isin === i_isin) user_amounts.push(sec.quantity);
            });
        });
        let sim = ss.cosine_similarity(target_amounts, user_amounts);
        similarity_score.push({'user' : user, 'sim' : sim});
    });

    similarity_score.sort((a, b) => b.sim - a.sim);
    similarity_score.slice(0, k);
    similarity_score.map(e => e.user);
    return similarity_score;
};

exports.filterKMostSimilarUsersPreferenceBased = (target, users, k) => {
    let similarity_score = [];
    let target_vector = target.uservector;
    users.forEach(user => {
        let user_vector = user.uservector;
        let sim = ss.cosine_similarity(target_vector, user_vector);
        similarity_score.push({'user' : user, 'sim' : sim});
    });

    similarity_score.sort((a, b) => b.sim - a.sim);
    similarity_score.slice(0, k);
    similarity_score.map(e => e.user);
    return similarity_score;
};

//you may add more filtering methods here
//TODO