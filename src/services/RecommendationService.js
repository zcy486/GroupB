const ss = require('./SimilarityService');

// Calculates content-based recommendation
exports.contentBased = (ui, items, owned) => {
    let top = [];
    items.forEach((item,idx) => {
        if(owned.indexOf(idx) === -1)
            top.push({'key':idx,'sim':ss.cosine_similarity(ui,item)});
    });

    top.sort(function(a,b){
        return b.sim-a.sim;
    });

    top = top.slice(0,5); //return the top five relevant securities
    return top;
};
