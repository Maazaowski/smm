import { put, list, del, head } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

/**
 * Where essay images live.
 *
 * Production is Vercel, whose filesystem is read-only at request time, so the
 * files go to Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set. Without the
 * token, development writes to `public/uploads/` (git-ignored) so the whole
 * flow works on a laptop with no account. A production deploy without the
 * token refuses uploads rather than silently writing somewhere that vanishes
 * on the next cold start.
 */

export interface MediaItem {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

export type MediaBackend = "blob" | "local";

const BLOB_PREFIX = "posts/";
const LOCAL_ROOT = path.join(process.cwd(), "public", "uploads");
const LOCAL_URL = "/uploads/";

export function mediaBackend(): MediaBackend | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.NODE_ENV !== "production") return "local";
  return null;
}

export async function saveMedia(
  pathname: string,
  body: Buffer,
  contentType: string
): Promise<MediaItem> {
  const backend = mediaBackend();
  if (backend === "blob") {
    const blob = await put(BLOB_PREFIX + pathname, body, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      // The pathname carries a content hash, so a re-upload of the same bytes
      // under the same name is the same file. Overwriting is the right call.
      allowOverwrite: true,
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
      size: body.byteLength,
      uploadedAt: new Date().toISOString(),
    };
  }
  if (backend === "local") {
    const target = safeLocalPath(pathname);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body);
    return {
      url: LOCAL_URL + pathname,
      pathname,
      size: body.byteLength,
      uploadedAt: new Date().toISOString(),
    };
  }
  throw new MediaError(
    "Image storage is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment.",
    503
  );
}

export async function listMedia(): Promise<MediaItem[]> {
  const backend = mediaBackend();
  if (backend === "blob") {
    const items: MediaItem[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: BLOB_PREFIX, cursor, limit: 500 });
      for (const b of page.blobs) {
        items.push({
          url: b.url,
          pathname: b.pathname.slice(BLOB_PREFIX.length),
          size: b.size,
          uploadedAt: b.uploadedAt.toISOString(),
        });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }
  if (backend === "local") {
    const items: MediaItem[] = [];
    await walk(LOCAL_ROOT, "", items);
    return items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }
  return [];
}

export async function deleteMedia(url: string): Promise<void> {
  const backend = mediaBackend();
  if (backend === "blob") {
    // Only our own files. `head` throws for a URL outside the store.
    const meta = await head(url);
    if (!meta.pathname.startsWith(BLOB_PREFIX)) {
      throw new MediaError("Not an essay image.", 400);
    }
    await del(url);
    return;
  }
  if (backend === "local") {
    if (!url.startsWith(LOCAL_URL)) throw new MediaError("Not an essay image.", 400);
    const target = safeLocalPath(url.slice(LOCAL_URL.length));
    await fs.rm(target, { force: true });
    return;
  }
  throw new MediaError("Image storage is not configured.", 503);
}

export class MediaError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Resolve inside the uploads folder, or refuse. Guards `..` in a pathname. */
function safeLocalPath(pathname: string): string {
  const target = path.resolve(LOCAL_ROOT, pathname);
  if (!target.startsWith(LOCAL_ROOT + path.sep)) {
    throw new MediaError("Bad path.", 400);
  }
  return target;
}

async function walk(root: string, rel: string, out: MediaItem[]) {
  let entries;
  try {
    entries = await fs.readdir(path.join(root, rel), { withFileTypes: true });
  } catch {
    return; // no uploads yet
  }
  for (const e of entries) {
    const relPath = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      await walk(root, relPath, out);
    } else {
      const stat = await fs.stat(path.join(root, relPath));
      out.push({
        url: LOCAL_URL + relPath.split(path.sep).join("/"),
        pathname: relPath.split(path.sep).join("/"),
        size: stat.size,
        uploadedAt: stat.mtime.toISOString(),
      });
    }
  }
}
