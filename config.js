const dotenv = require('dotenv');

dotenv.config();

module.exports.awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucketName: process.env.S3_BUCKET_NAME,
    s3Endpoint: process.env.AWS_S3_ENDPOINT || 'https://s3.amazonaws.com',
};