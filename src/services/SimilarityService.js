const tf = require('@tensorflow/tfjs');

    // Calculates the cosine similarity of two vectors
exports.cosine_similarity = (v1, v2) => {
    const t1 = tf.tensor(v1);
    const t2 = tf.tensor(v2);

    const scalar_prod_t1_t2 = tf.sum(tf.mul(t1,t2));

    const t1_norm = tf.sqrt(tf.sum(tf.square(t1)));
    const t2_norm = tf.sqrt(tf.sum(tf.square(t2)));

    return tf.div(scalar_prod_t1_t2, tf.mul(t1_norm, t2_norm)).arraySync();
};

// Calculates the pearson similarity of two vectors.
exports.pearson_similarity = (v1, v2) => {
    let t1 = tf.tensor(v1);
    let t2 = tf.tensor(v2);

    // Mean centered tensors of t1 and t2.
    // This means the mean of all entries is substracted from each entry.
    let mean_centered1 = tf.sub(t1, t1.mean());
    let mean_centered2 = tf.sub(t2, t2.mean());

    return this.cosine_similarity(mean_centered1.arraySync(), mean_centered2.arraySync())
};
