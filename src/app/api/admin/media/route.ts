import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { verifyAuth } from "@/lib/auth";
import {
  deleteMedia,
  listMedia,
  mediaBackend,
  saveMedia,
  MediaError,
} from "@/lib/media";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Essay images.
 *
 * The editor does the resizing, cropping and re-encoding in the browser and
 * sends the finished file, so this route only has to check it, name it and
 * store it. Keeping the pixels out of the function also keeps every upload
 * under Vercel's request-body ceiling, which is the real reason the editor
 * re-encodes before sending.
 */

// Vercel caps a serverless request body at 4.5 MB. Stay under it with room.
const MAX_BYTES = 4 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await listMedia();
    return NextResponse.json({ items, backend: mediaBackend() });
  } catch (err) {
    return fail(err, "list");
  }
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!mediaBackend()) {
    return NextResponse.json(
      { error: "Image storage is not configured. Add BLOB_READ_WRITE_TOKEN to the project environment." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file in the upload." }, { status: 400 });
  }

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Unsupported type "${file.type || "unknown"}". Use webp, jpeg, png, gif, avif or svg.` },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is 4 MB. Lower the width or quality.` },
      { status: 413 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (ext === "svg") {
    const text = bytes.toString("utf8");
    if (/<script|\son[a-z]+\s*=|javascript:/i.test(text)) {
      return NextResponse.json(
        { error: "That SVG contains script, which the site will not serve." },
        { status: 422 }
      );
    }
  }

  const post = cleanSegment(String(form.get("post") ?? "")) || "misc";
  const baseName =
    cleanSegment(String(form.get("name") ?? "")) ||
    cleanSegment(file.name.replace(/\.[a-z0-9]+$/i, "")) ||
    "image";
  const width = positiveInt(form.get("width"));
  const height = positiveInt(form.get("height"));
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 8);

  // Dimensions ride in the filename so the library can hand them back to the
  // editor later without a metadata table. `-1200x800-` is easy to read in
  // a URL and is parsed with one regexp on the way out.
  const dims = width && height ? `-${width}x${height}` : "";
  const pathname = `${post}/${baseName}${dims}-${hash}.${ext}`;

  try {
    const item = await saveMedia(pathname, bytes, file.type);
    return NextResponse.json({ ...item, width, height });
  } catch (err) {
    return fail(err, "upload");
  }
}

export async function DELETE(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  try {
    await deleteMedia(url);
    return NextResponse.json({ success: true });
  } catch (err) {
    return fail(err, "delete");
  }
}

function cleanSegment(s: string): string {
  return slugify(s).slice(0, 60);
}

function positiveInt(v: FormDataEntryValue | null): number | undefined {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 20000 ? n : undefined;
}

function fail(err: unknown, what: string) {
  if (err instanceof MediaError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[admin/media ${what}]`, message);
  return NextResponse.json({ error: message }, { status: 500 });
}
