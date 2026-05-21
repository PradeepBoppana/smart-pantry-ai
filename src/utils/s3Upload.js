/**
 * Smart Pantry AI — S3 Upload Utility
 * =====================================
 * Handles image uploads to AWS S3 for grocery photos and receipts.
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET = process.env.AWS_S3_BUCKET || 'smart-pantry-images';

/**
 * Upload a buffer (image) to S3
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimetype - e.g. 'image/jpeg'
 * @param {string} folder - S3 folder prefix ('scans', 'receipts', 'avatars')
 * @returns {string} - Public URL of the uploaded image
 */
async function uploadToS3(buffer, mimetype, folder = 'scans') {
  const ext = mimetype === 'image/png' ? 'png' : 'jpg';
  const key = `${folder}/${uuidv4()}.${ext}`;

  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}

/**
 * Upload a base64-encoded image to S3
 * @param {string} base64Data - Base64 string (with or without data URI prefix)
 * @param {string} folder - S3 folder prefix
 * @returns {string} - Public URL
 */
async function uploadBase64ToS3(base64Data, folder = 'scans') {
  // Strip data URI prefix if present
  const clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(clean, 'base64');

  // Detect mime type from prefix or default to jpeg
  let mimetype = 'image/jpeg';
  if (base64Data.startsWith('data:image/png')) mimetype = 'image/png';
  if (base64Data.startsWith('data:image/webp')) mimetype = 'image/webp';

  return uploadToS3(buffer, mimetype, folder);
}

/**
 * Delete a file from S3
 * @param {string} url - Full S3 URL
 */
async function deleteFromS3(url) {
  try {
    const key = url.split('.com/')[1];
    if (!key) return;

    await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
  }
}

module.exports = { uploadToS3, uploadBase64ToS3, deleteFromS3 };
