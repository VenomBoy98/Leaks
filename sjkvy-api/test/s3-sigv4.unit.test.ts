// s3-sigv4.unit.test.ts — validates the S3 presigner against AWS's published
// presigned-URL example (docs: "Signature Calculations — Query String / Presigned
// URL", examplebucket/test.txt). Proves SigV4 correctness with NO network/credentials,
// so the S3 storage driver is trustworthy before it ever touches a real bucket.
import { describe, expect, it } from 'vitest';
import { presignS3 } from '../src/storage/s3.js';

describe('S3 SigV4 presigner', () => {
  it('reproduces the AWS documented presigned GET signature', () => {
    // Fixed inputs from the AWS example.
    const url = presignS3(
      {
        bucket: 'examplebucket',
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        host: 'examplebucket.s3.amazonaws.com', // legacy us-east-1 host used by the doc
        uploadTtlSec: 86400,
        downloadTtlSec: 86400,
      },
      'GET',
      'test.txt',
      86400,
      new Date('2013-05-24T00:00:00Z'),
    );
    const sig = new URL(url).searchParams.get('X-Amz-Signature');
    expect(sig).toBe('aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404');
  });

  it('encodes the credential scope and signed headers in the query', () => {
    const url = presignS3(
      {
        bucket: 'b',
        region: 'ap-south-1',
        accessKeyId: 'AKIA',
        secretAccessKey: 'secret',
        uploadTtlSec: 300,
        downloadTtlSec: 300,
      },
      'PUT',
      'app/x/MATRIC/1',
      300,
    );
    const p = new URL(url).searchParams;
    expect(p.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
    expect(p.get('X-Amz-SignedHeaders')).toBe('host');
    expect(p.get('X-Amz-Credential')).toContain('ap-south-1/s3/aws4_request');
    expect(url).toContain('b.s3.ap-south-1.amazonaws.com');
  });
});
