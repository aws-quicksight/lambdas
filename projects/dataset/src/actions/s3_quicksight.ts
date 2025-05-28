import {
  GetObjectCommand,
  type GetObjectCommandOutput,
  PutObjectCommand,
  type PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { env } from '../config/env.js';

export const obtainS3Client = (): S3Client => {
  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_KEY,
      secretAccessKey: env.AWS_SECRET,
    },
  });
};

export const getObjectFromS3 = async (
  object: string,
  bucket: string,
): Promise<NonNullable<GetObjectCommandOutput['Body']>> => {
  const s3Client = obtainS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: object,
  });
  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error('No se pudo obtener el archivo');
  }

  return response.Body;
};

export const putObjectToS3 = async (path: string, content: string, bucket: string): Promise<PutObjectCommandOutput> => {
  const s3Client = obtainS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: path,
    Body: content,
  });
  const response = await s3Client.send(command);
  if (!response.ETag) {
    throw new Error('No se pudo guardar el archivo');
  }

  return response;
};
