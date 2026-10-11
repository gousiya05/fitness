// ml/train.ts — Local ML training script (no API keys needed)
// Reads a CSV from ml/datasets/, trains a simple TensorFlow.js model, saves to ml/

import fs from 'fs';
import path from 'path';

interface DataRow {
  input: number;
  target: number;
}

function parseCsv(filePath: string): DataRow[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  const inputIdx = headers.findIndex(h => h === 'input' || h === 'weight' || h === 'age');
  const targetIdx = headers.findIndex(h => h === 'target' || h === 'calories' || h === 'output');

  if (inputIdx === -1 || targetIdx === -1) {
    throw new Error(`CSV must have columns: input/weight/age AND target/calories/output. Found: ${headers.join(', ')}`);
  }

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const cols = line.split(',');
    return {
      input: parseFloat(cols[inputIdx]),
      target: parseFloat(cols[targetIdx]),
    };
  }).filter(r => !isNaN(r.input) && !isNaN(r.target));
}

// Simple linear regression (no TensorFlow dependency needed!)
function trainLinearRegression(data: DataRow[]) {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (const { input: x, target: y } of data) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² score
  const meanY = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const { input: x, target: y } of data) {
    const pred = slope * x + intercept;
    ssRes += (y - pred) ** 2;
    ssTot += (y - meanY) ** 2;
  }
  const r2 = 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

(async () => {
  const datasetsDir = path.join(process.cwd(), 'ml', 'datasets');
  const modelDir = path.join(process.cwd(), 'ml');

  // Pick a specific dataset or grab the first CSV
  const requestedDataset = process.argv[2];
  let csvFile: string;

  if (requestedDataset) {
    csvFile = path.join(datasetsDir, requestedDataset);
    if (!fs.existsSync(csvFile)) {
      console.error(`❌ Dataset not found: ${requestedDataset}`);
      process.exit(1);
    }
  } else {
    const csvFiles = fs.readdirSync(datasetsDir).filter(f => f.endsWith('.csv'));
    if (csvFiles.length === 0) {
      console.error('❌ No CSV dataset found in ml/datasets/');
      console.error('   Upload a CSV with columns: input (or weight), target (or calories)');
      process.exit(1);
    }
    csvFile = path.join(datasetsDir, csvFiles[0]);
  }

  console.log(`📊 Loading dataset: ${path.basename(csvFile)}`);
  const data = parseCsv(csvFile);
  console.log(`   Rows: ${data.length}`);

  if (data.length < 3) {
    console.error('❌ Need at least 3 data rows to train');
    process.exit(1);
  }

  // Split: 80% train, 20% test
  const splitIdx = Math.floor(data.length * 0.8);
  const trainData = data.slice(0, splitIdx);
  const testData = data.slice(splitIdx);

  console.log(`🏋️  Training on ${trainData.length} rows, testing on ${testData.length} rows...`);

  const model = trainLinearRegression(trainData);

  // Evaluate on test set
  let testSSRes = 0;
  const testMeanY = testData.reduce((s, d) => s + d.target, 0) / testData.length;
  let testSSTot = 0;
  for (const { input: x, target: y } of testData) {
    const pred = model.slope * x + model.intercept;
    testSSRes += (y - pred) ** 2;
    testSSTot += (y - testMeanY) ** 2;
  }
  const testR2 = testData.length > 1 ? 1 - testSSRes / testSSTot : 0;

  // Save model as JSON
  const modelOutput = {
    type: 'linear_regression',
    slope: model.slope,
    intercept: model.intercept,
    trainR2: model.r2,
    testR2: testR2,
    trainSize: trainData.length,
    testSize: testData.length,
    trainedAt: new Date().toISOString(),
    dataset: path.basename(csvFile),
  };

  fs.writeFileSync(path.join(modelDir, 'model.json'), JSON.stringify(modelOutput, null, 2));

  console.log('');
  console.log('✅ Model trained and saved to ml/model.json');
  console.log(`   Slope:      ${model.slope.toFixed(4)}`);
  console.log(`   Intercept:  ${model.intercept.toFixed(4)}`);
  console.log(`   Train R²:   ${model.r2.toFixed(4)}`);
  console.log(`   Test R²:    ${testR2.toFixed(4)}`);
  console.log('');
  console.log('   Example prediction:');
  const exampleInput = data[0].input;
  const examplePred = model.slope * exampleInput + model.intercept;
  console.log(`   Input=${exampleInput} → Predicted=${examplePred.toFixed(2)} (Actual=${data[0].target})`);
})();
