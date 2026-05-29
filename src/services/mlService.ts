import * as tf from '@tensorflow/tfjs-node';

let model: tf.LayersModel | null = null;

export async function loadModel() {
  if (!model) {
    // Loads the model saved in ./ml/model.json relative to project root
    model = await tf.loadLayersModel('file://' + process.cwd() + '/ml/model.json');
  }
  return model;
}

export async function predict(input: number[]) {
  await loadModel();
  if (!model) throw new Error('Model not loaded');
  const tensor = tf.tensor2d([input]);
  const pred = model.predict(tensor) as tf.Tensor;
  const result = (await pred.data())[0];
  return result;
}
