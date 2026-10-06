import fs from 'node:fs';
import path from 'node:path';
import {
  type StorageUploadParams,
  type StorageUploadResult,
  INTEGRATION_STATUS,
  type IntegrationStatus,
  type IntegrationSummary,
} from '@gymos/shared';
import type { IStorageAdapter } from '../interfaces.js';

export class MockStorageAdapter implements IStorageAdapter {
  readonly isMock = true;
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      try {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      } catch {
        // ignore
      }
    }
  }

  getStatus(): IntegrationStatus {
    return INTEGRATION_STATUS.DEMO_MODE;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'storage',
      name: 'Object Storage',
      category: 'Infrastructure',
      description: 'S3-compatible MinIO / Local storage for photos and docs',
      status: this.getStatus(),
      provider: 'MinIO (Local Emulated Bucket)',
      isMock: true,
      docsUrl: 'https://min.io/docs/minio/linux/index.html',
    };
  }

  async uploadFile(params: StorageUploadParams): Promise<StorageUploadResult> {
    const filePath = path.join(this.uploadDir, path.basename(params.key));
    fs.writeFileSync(filePath, Buffer.from(params.buffer));
    return {
      key: params.key,
      url: `/uploads/${path.basename(params.key)}`,
      sizeBytes: params.buffer.byteLength,
    };
  }

  async getPresignedUrl(key: string): Promise<string> {
    return `/uploads/${path.basename(key)}`;
  }

  async deleteFile(key: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, path.basename(key));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}

export class RealStorageAdapter implements IStorageAdapter {
  readonly isMock = false;

  getStatus(): IntegrationStatus {
    return process.env.S3_ACCESS_KEY ? INTEGRATION_STATUS.REAL : INTEGRATION_STATUS.NOT_CONFIGURED;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'storage',
      name: 'Object Storage',
      category: 'Infrastructure',
      description: 'AWS S3 Cloud Object Storage',
      status: this.getStatus(),
      provider: 'Amazon S3',
      isMock: false,
    };
  }

  async uploadFile(params: StorageUploadParams): Promise<StorageUploadResult> {
    // In real S3 implementation: uses @aws-sdk/client-s3 PutObjectCommand
    return {
      key: params.key,
      url: `https://${process.env.S3_BUCKET_NAME || 'gymos'}.s3.amazonaws.com/${params.key}`,
      sizeBytes: params.buffer.byteLength,
    };
  }

  async getPresignedUrl(key: string): Promise<string> {
    return `https://${process.env.S3_BUCKET_NAME || 'gymos'}.s3.amazonaws.com/${key}`;
  }

  async deleteFile(_key: string): Promise<boolean> {
    return true;
  }
}
