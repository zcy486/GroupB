const ss = require('./SimilarityService');

exports.filterByAgerange = function(target, users){
    var filter_by_agerange = users.filter(user => user.agerange == target.agerange);
    return filter_by_agerange;
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

    return s1.filter(sec => s2.includes(sec));
};

exports.targetDoesNotOwn = (target_sec, user_sec) => {
    let t_sec = [];
    let u_sec = [];
    target_sec.forEach(sec => {
        t_sec.push(sec.isin);
    });
    user_sec.forEach(sec => {
        u_sec.push(sec.isin);
    });

    return u_sec.filter(sec => !t_sec.includes(sec));
};


exports.filterKMostSimilarUsersSecurityBased = (target, users, k) => {
    let similarity_score = [];
    let target_sec = target.ownedSec;
    users.forEach(user => {
        let user_sec = user.ownedSec;
        let intersection = this.securityIntersection(target_sec, user_sec);
        if (intersection.length < 5) return;
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