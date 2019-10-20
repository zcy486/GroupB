const fs = require('./FilteringService');

// used for big samples
exports.cfBasedVoting = (target, users, weighted) => {
    let recommendation = [];
    let target_sec = target.ownedSec;
    let top_similar_users = fs.filterKMostSimilarUsersSecurityBased(target, users, 20);

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

// used for small samples (samples<50||samples<30)
exports.voting = (target, users) => {
    let recommendation = [];
    let target_sec = target.ownedSec;
    let filtered_users = fs.filterByAgerange(target, users);

    filtered_users.forEach(user => {
        let user_sec = user.ownedSec;
        let target_not_owned = fs.targetDoesNotOwn(target_sec, user_sec);

        target_not_owned.forEach(isin => {
            let i = recommendation.findIndex(obj => isin === obj.isin);
            if (i === -1) {
                recommendation.push({'isin' : isin, 'votes' : 1});
            } else {
                ++recommendation[i].votes;
            }
        });
    });

    recommendation.sort((a, b) => b.votes - a.votes);
    recommendation.slice(0, 5);
    return recommendation;
};
