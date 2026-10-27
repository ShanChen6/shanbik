import { DEFAULT_CROP } from "./geometry";
import type { ImageSource } from "./types";
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_RETAINED_EDGE = 1024;
/** Local-only raster decoding. Browser honors photograph EXIF orientation. No network upload. */
export async function decodeImage(
  file: File,
  signal?: AbortSignal,
): Promise<ImageSource> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw Error(
      "Chỉ nhận JPEG, PNG hoặc WebP. Hãy chuyển HEIC/SVG/GIF sang ảnh được hỗ trợ.",
    );
  if (file.size > MAX_FILE_BYTES || !file.size)
    throw Error("Ảnh cần có dung lượng từ 1 byte đến 8 MiB.");
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const signature =
    file.type === "image/png"
      ? [137, 80, 78, 71, 13, 10, 26, 10].every(
          (byte, index) => header[index] === byte,
        )
      : file.type === "image/jpeg"
        ? header[0] === 255 && header[1] === 216 && header[2] === 255
        : String.fromCharCode(...header.slice(0, 4)) === "RIFF" &&
          String.fromCharCode(...header.slice(8, 12)) === "WEBP";
  if (!signature)
    throw Error("Không đọc được ảnh: chữ ký tệp không khớp JPEG/PNG/WebP.");
  signal?.throwIfAborted();
  const url = URL.createObjectURL(file),
    image = new Image();
  const abort = () => {
    image.src = "";
  };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    image.src = url;
    await image.decode();
    signal?.throwIfAborted();
    if (
      image.naturalWidth < 90 ||
      image.naturalHeight < 90 ||
      image.naturalWidth * image.naturalHeight > 24_000_000
    )
      throw Error("Ảnh cần ít nhất 90×90 và không quá 24 megapixel.");
    const scale = Math.min(
      1,
      MAX_RETAINED_EDGE / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw Error("Không đọc được ảnh trong trình duyệt này.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    return {
      image: { width: pixels.width, height: pixels.height, data: pixels.data },
      preview: canvas.toDataURL("image/png"),
      crop: DEFAULT_CROP,
      turns: 0,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Ảnh cần"))
      throw error;
    throw Error(
      "Không đọc được ảnh. Hãy thử JPEG/PNG/WebP hợp lệ hoặc nhập màu bằng tay.",
    );
  } finally {
    signal?.removeEventListener("abort", abort);
    image.src = "";
    URL.revokeObjectURL(url);
  }
}
