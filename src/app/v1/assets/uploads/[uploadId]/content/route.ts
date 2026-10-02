import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { uploadAssetContent } from '@/server/asset-upload';
import { AppError } from '@/server/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function PUT(request: Request, context: { params: Promise<{ uploadId: string }> }) {
  const request_id = randomUUID();
  try {
    const { uploadId } = await context.params;
    const result = await uploadAssetContent(request, uploadId);
    return Response.json(
      { request_id, ...result },
      {
        status: 202,
        headers: {
          'Cache-Control': 'no-store',
          'X-Request-Id': request_id,
          Location: '/v1/operations/' + result.operation.id,
          'Retry-After': '2',
        },
      },
    );
  } catch (error) {
    const known =
      error instanceof AppError
        ? error
        : error instanceof ZodError
          ? new AppError(400, 'VALIDATION_FAILED', 'Upload identifier is invalid.')
          : new AppError(
              503,
              'ASSET_TRANSFER_UNAVAILABLE',
              'Image storage or transfer is unavailable.',
            );
    return Response.json(
      {
        request_id,
        error: {
          code: known.code,
          message: known.message,
          retryable: known.status === 503 || known.status === 429,
        },
      },
      {
        status: known.status,
        headers: { 'Cache-Control': 'no-store', 'X-Request-Id': request_id },
      },
    );
  }
}
