const tf = require('@tensorflow/tfjs');


//↑------------------dependencies-------------------↑
//please make sure that all needed packages are installed
//if not, run "npm install <package_name>"


//calculate the cosine similarities of two vectors
 function sim_cosine(v1, v2){
    const t1 = tf.tensor(v1);
    const t2 = tf.tensor(v2);

    const scalar_prod_t1_t2 = tf.sum(tf.mul(t1,t2));

    const t1_norm = tf.sqrt(tf.sum(tf.square(t1)));
    const t2_norm = tf.sqrt(tf.sum(tf.square(t2)));

    const cosine = tf.div(scalar_prod_t1_t2, tf.mul(t1_norm,t2_norm)).arraySync();

    return cosine;
}

exports.topMatch = function(ui, items, owned){
    var top = [];
    items.forEach((item,idx) => {
        if(owned.indexOf(idx) == -1)
        top.push({'key':idx,'sim':sim_cosine(ui,item)});
    });

    top.sort(function(a,b){
        return b.sim-a.sim;
    });

    top = top.slice(0,5); //return the top five relevant securities
    return top;
};
