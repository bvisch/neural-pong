
import tensorflow as tf
import numpy as np
from pymongo import MongoClient

INPUT_SIZE = 5
L1_SIZE = 50
OUTPUT_SIZE = 3

inputs = tf.placeholder(shape=[None,INPUT_SIZE], dtype=tf.float32)
W1 = tf.Variable(tf.random_uniform([INPUT_SIZE,L1_SIZE], 0, 0.01))
b1 = tf.Variable(tf.zeros([L1_SIZE]))
hidden = tf.nn.sigmoid(tf.matmul(inputs, W1) + b1)
W2 = tf.Variable(tf.random_uniform([L1_SIZE,OUTPUT_SIZE], 0, 0.1))
b2 = tf.Variable(tf.zeros([OUTPUT_SIZE]))
output = tf.matmul(hidden, W2) + b2
predict = tf.nn.softmax(output)

y = tf.placeholder(shape=[None,OUTPUT_SIZE], dtype=tf.float32)
cost = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(output, y))
trainer = tf.train.AdamOptimizer(learning_rate=0.1)
train = trainer.minimize(cost)


client = MongoClient('localhost', 27017)
db = client.neural_pong_development
training_data = [obj for obj in db.training_data.find()]

X_train = [obj['input'] for obj in training_data]
y_train = [obj['output'] for obj in training_data]
X_train = np.array(X_train)
y_train = np.array(y_train)
print X_train
print y_train


sess = tf.Session()
init = tf.initialize_all_variables()
sess.run(init)

sess.run(train, feed_dict={ inputs: X_train, y: y_train })
h_weights, h_bias, o_weights, o_bias = sess.run([W1, b1, W2, b2], feed_dict={ inputs: X_train })

db.network.insert_one({ 'hidden_weights': h_weights.T.tolist(), 'hidden_bias': h_bias.tolist(), 'output_weights': o_weights.T.tolist(), 'output_bias': o_bias.tolist() })
