// Use 'require' for all dependencies to match your main app file
const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
// Make sure your config file also uses module.exports
const { awsConfig } = require('./config');

const s3 = new S3Client({
    credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
    },
    region: awsConfig.region,
});

const BUCKET_NAME = awsConfig.bucketName;

// Mime types map remains the same
const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// gg
class S3Service {
    async uploadFile(fileBuffer, originalName, s3Key = null, isPublic = false) { // Added default for isPublic
        const fileExt = path.extname(originalName);
        const key = s3Key || `${uuidv4()}${fileExt}`;
        let params = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: this._getContentType(fileExt),
        };
        // In AWS SDK v3, ACL is set this way
        if (isPublic) {
            params.ACL = 'public-read';
        }

        await s3.send(new PutObjectCommand(params));
        return key;
    }

    async deleteFile(s3Key) {
        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
        };
        await s3.send(new DeleteObjectCommand(params));
        return true;
    }

    async existFile(s3Key) {
        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
        };
        try {
            await s3.send(new HeadObjectCommand(params));
            return true;
        } catch (error) {
            if (
                error.name === 'NotFound' ||
                error.$metadata?.httpStatusCode === 404
            ) {
                return false;
            }
            throw error;
        }
    }

    async generateSignedDownloadUrl(s3Key, expiresInSeconds = 300) {
        if (!s3Key) {
            throw new Error(
                's3Key is required to generate a signed download URL.'
            );
        }
        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ResponseContentDisposition: `attachment; filename="${path.basename(
                s3Key
            )}"`,
        };
        const command = new GetObjectCommand(params);
        return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    }

    async generateSignedUploadUrl(
        s3Key,
        expiresInSeconds = 300,
        contentType = 'application/octet-stream'
    ) {
        if (!s3Key) {
            throw new Error(
                's3Key is required to generate a signed upload URL.'
            );
        }
        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ContentType: contentType,
        };
        const command = new PutObjectCommand(params);
        return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    }

    _getContentType(ext) {
        return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
    }
}

module.exports = new S3Service();