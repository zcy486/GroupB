var tf = require('@tensorflow/tfjs');


//↑------------------dependencies-------------------↑
//please make sure that all needed packages are installed
//if not, run "npm install <package_name>"


//calculate the cosine similarities of two items
 function sim_cosine(item1, item2){
    const ti1 = tf.tensor(item1);
    const ti2 = tf.tensor(item2);

    const i1_norm = tf.sqrt(tf.sum(tf.square(ti1)));
    const i2_norm = tf.sqrt(tf.sum(tf.square(ti2)));

    const i1_i2 = tf.sum(tf.mul(ti1,ti2));

    const cosin = tf.div(i1_i2, tf.mul(i1_norm,i2_norm)).arraySync();

    return cosin;
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
}
