// services/s3.js — profile photo / document uploads to Amazon S3.
// Port of M_applications::uploadToAmazonS3. Credentials come from the environment
// (NEVER hard-code them). Bucket + region default to the original values.
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const REGION = process.env.AWS_REGION || 'ap-south-1';
const BUCKET = process.env.S3_BUCKET || 'dice-admissions';

let client = null;
function getClient() {
  if (client) return client;
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return null;
  client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

// Uploads the local file to s3://<bucket>/<applnID>/<fileName>.
async function uploadToAmazonS3(applnID, fileName, localPath) {
  const c = getClient();
  if (!c) {
    console.warn('[s3] AWS credentials not configured — skipping upload of', fileName);
    return false;
  }
  try {
    const abs = path.resolve(localPath);
    if (!fs.existsSync(abs)) {
      console.warn('[s3] source file missing:', abs);
      return false;
    }
    await c.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${applnID}/${fileName}`,
        Body: fs.createReadStream(abs),
      })
    );
    return true;
  } catch (err) {
    console.error('[s3] upload failed for', fileName, '-', err.message);
    return false;
  }
}

module.exports = { uploadToAmazonS3 };
