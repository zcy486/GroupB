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
