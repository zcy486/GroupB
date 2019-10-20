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
}

//you may add more filtering methods here
//TODO