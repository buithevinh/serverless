const modelURL = 'https://teachablemachine.withgoogle.com/models/xKlYuxUch/' + 'model.json';
const metadataURL = 'https://teachablemachine.withgoogle.com/models/xKlYuxUch/' + 'metadata.json';
const loadTf = require('tfjs-lambda');
const { default: axios } = require('axios');
const Jimp = require("jimp");
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});


router.post('/get-tagging', upload.single('file'), async (req, res) => {
  const time = new Date().getTime();
  res.json({
    status: 200,
    time: time
  });
  if(!tf) {
    tf = await loadTf()
  }
  if(!model) {
    model = await tf.loadLayersModel(modelURL);
  }
  const metadata = await axios.get(metadataURL);
  const fBuffer = req.file.buffer;
  const image = await Jimp.read(fBuffer);
  image.cover(224, 224, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
  const NUM_OF_CHANNELS = 3;
  let arrays = new Float32Array(224 * 224 * NUM_OF_CHANNELS);
  let i = 0;
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
    pixel.r = pixel.r / 127.0 - 1;
    pixel.g = pixel.g / 127.0 - 1;
    pixel.b = pixel.b / 127.0 - 1;
    pixel.a = pixel.a / 127.0 - 1;
    arrays[i * NUM_OF_CHANNELS + 0] = pixel.r;
    arrays[i * NUM_OF_CHANNELS + 1] = pixel.g;
    arrays[i * NUM_OF_CHANNELS + 2] = pixel.b;
    i++;
  });
  const outShape = [224, 224, NUM_OF_CHANNELS];
  let img_tensor = await tf.tidy(() => tf.tensor3d(arrays, outShape, 'float32'));
  img_tensor = img_tensor.expandDims(0);
  const labels = metadata.data.labels;

  let predictions = await model.predict(img_tensor).dataSync();

  const total = predictions.reduce((t, item) => {
    return t += item;
  }, 0)
  const classify = [];
  for (let i = 0; i < predictions.length; i++) {
    const label = labels[i];
    const probability = Math.round(predictions[i] * 100 / total);
    if (probability > 0) {
      classify.push({
        label: label,
        score: probability
      })
    }
  }

  client.set(time, JSON.stringify(classify));
})
app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
const port = process.env.port || 8000;
app.listen(port, () => console.log('Local app listening on port 8000!'));
module.exports = app;
module.exports.handler = serverless(app);