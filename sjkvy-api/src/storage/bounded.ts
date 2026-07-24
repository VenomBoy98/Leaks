// storage/bounded.ts — bounded download of a (presigned) object URL for trusted server-side
// processing. Enforces two independent limits so a hostile or corrupt object cannot exhaust
// the scanner worker:
//   * maxBytes  — reject via Content-Length up front when advertised, and hard-stop the stream
//                 the moment accumulated bytes exceed the cap (works even when the length lies
//                 or is absent, e.g. chunked transfer).
//   * timeoutMs — an AbortController fires after the deadline, covering slow-loris responses.
// Bytes are streamed, never buffered beyond the cap.
import type { ObjectReadLimits } from './driver.js';

export class ObjectTooLargeError extends Error {
  constructor(max: number) {
    super(`object exceeds size limit of ${max} bytes`);
    this.name = 'ObjectTooLargeError';
  }
}

export async function boundedFetch(
  url: string,
  { maxBytes, timeoutMs }: ObjectReadLimits,
  fetchImpl: typeof fetch = fetch,
): Promise<Buffer> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: ac.signal });
    if (!res.ok) throw new Error(`object fetch failed: ${res.status}`);

    // Early rejection when the server advertises a length larger than the cap.
    const advertised = Number(res.headers.get('content-length') ?? '');
    if (Number.isFinite(advertised) && advertised > maxBytes) throw new ObjectTooLargeError(maxBytes);

    if (!res.body) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > maxBytes) throw new ObjectTooLargeError(maxBytes);
      return buf;
    }

    const reader = res.body.getReader();
    const chunks: Buffer[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new ObjectTooLargeError(maxBytes);
      }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks, total);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error(`object read timed out after ${timeoutMs}ms`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
