const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Jimp } = require("jimp");

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const RESIZED_BUCKET = process.env.S3_RESIZED_BUCKET;

/**
 * AWS Lambda function to resize images uploaded to S3
 * Triggered by S3 PUT event on originals bucket
 * Resizes image to 300x300 thumbnail and saves to resized bucket
 * Uses Jimp (pure JavaScript, no native dependencies)
 */
exports.handler = async (event) => {
  console.log("Image resize Lambda triggered");
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    // Get S3 event details
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    console.log(`Processing image: ${key} from bucket: ${bucket}`);

    // 1. Get the original image from S3
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const getResponse = await s3Client.send(getCommand);

    // Convert stream to buffer
    const imageBuffer = await streamToBuffer(getResponse.Body);

    console.log(`Original image size: ${imageBuffer.length} bytes`);

    // 2. Resize image to 300x300 using Jimp (correct syntax for v1.x)
    const image = await Jimp.read(imageBuffer);

    // Resize and cover (crop to fit) - v1.x uses object syntax
    await image.cover({ w: 300, h: 300 });

    // Convert to buffer
    const resizedImageBuffer = await image.getBuffer("image/jpeg");

    console.log(`Resized image size: ${resizedImageBuffer.length} bytes`);

    // 3. Upload resized image to resized bucket with same key
    const putCommand = new PutObjectCommand({
      Bucket: RESIZED_BUCKET,
      Key: key,
      Body: resizedImageBuffer,
      ContentType: "image/jpeg",
    });

    await s3Client.send(putCommand);

    console.log(`Successfully resized and uploaded: ${key} to ${RESIZED_BUCKET}`);

    // 4. Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Image resized successfully",
        originalBucket: bucket,
        resizedBucket: RESIZED_BUCKET,
        key: key,
      }),
    };
  } catch (error) {
    console.error("Error resizing image:", error);

    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to resize image",
        error: error.message,
      }),
    };
  }
};

/**
 * Helper function to convert stream to buffer
 */
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
