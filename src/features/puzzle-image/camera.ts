import { MAX_RETAINED_EDGE } from "./decode";
import { project } from "./geometry";
import type { ImageSource, PixelImage, Quad } from "./types";
/**
 * Live camera capture for image input. Frames are read locally from a
 * <video> into canvas pixels; nothing is recorded or uploaded. The stream
 * lifecycle is explicit so tracks always stop when the user leaves.
 */
export type CameraDevice = Readonly<{ id: string; label: string }>;
type MediaPort = Pick<MediaDevices, "getUserMedia" | "enumerateDevices">;
export type CameraProblem =
  "unsupported" | "denied" | "missing" | "busy" | "failed";
export const CAMERA_MESSAGES: Record<CameraProblem, string> = {
  unsupported:
    "Trình duyệt này không mở được camera (cần HTTPS và trình duyệt hỗ trợ). Hãy chọn ảnh có sẵn hoặc nhập màu bằng tay.",
  denied:
    "Chưa có quyền dùng camera. Bạn có thể cho phép trong cài đặt trang của trình duyệt rồi bật lại, hoặc chọn ảnh có sẵn/nhập màu bằng tay.",
  missing:
    "Không tìm thấy camera phù hợp. Hãy chọn camera khác, chọn ảnh có sẵn hoặc nhập màu bằng tay.",
  busy: "Camera đang được ứng dụng khác dùng hoặc không khởi động được. Đóng ứng dụng đó rồi thử lại, hoặc chọn ảnh có sẵn.",
  failed:
    "Không mở được camera. Thử lại, chọn ảnh có sẵn hoặc nhập màu bằng tay.",
};
export function cameraProblem(error: unknown): CameraProblem {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "missing";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "failed";
}
export const cameraConstraints = (
  deviceId?: string,
): MediaStreamConstraints => ({
  audio: false,
  video: {
    ...(deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: { ideal: "environment" } }),
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
});
/**
 * One camera at a time. `start` stops the previous stream first; a stream
 * that resolves after `stop`/a newer `start` is stopped immediately.
 */
export function createCameraSession(media: MediaPort | undefined) {
  let stream: MediaStream | null = null,
    generation = 0;
  const release = () => {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  };
  return {
    get active() {
      return stream;
    },
    async start(deviceId?: string): Promise<MediaStream> {
      if (!media?.getUserMedia) throw new CameraError("unsupported");
      release();
      const ticket = ++generation;
      let next: MediaStream;
      try {
        next = await media.getUserMedia(cameraConstraints(deviceId));
      } catch (error) {
        throw new CameraError(cameraProblem(error), error);
      }
      if (ticket !== generation) {
        next.getTracks().forEach((track) => track.stop());
        throw new CameraError("cancelled");
      }
      stream = next;
      return next;
    },
    stop() {
      generation++;
      release();
    },
    /** Labels are only available after permission was granted once. */
    async devices(): Promise<readonly CameraDevice[]> {
      if (!media?.enumerateDevices) return [];
      try {
        const all = await media.enumerateDevices();
        return all
          .filter((d) => d.kind === "videoinput" && d.deviceId)
          .map((d, index) => ({
            id: d.deviceId,
            label: d.label || `Camera ${index + 1}`,
          }));
      } catch {
        return [];
      }
    },
  };
}
export type CameraSession = ReturnType<typeof createCameraSession>;
export class CameraError extends Error {
  constructor(
    readonly problem: CameraProblem | "cancelled",
    cause?: unknown,
  ) {
    super(
      problem === "cancelled"
        ? "Camera start cancelled"
        : CAMERA_MESSAGES[problem],
      {
        cause,
      },
    );
  }
}
/** Centered square guide (fraction of the shorter edge), normalized to the frame. */
export function guideQuad(width: number, height: number, fill = 0.7): Quad {
  const side = Math.min(width, height) * fill,
    x0 = (width - side) / 2 / width,
    y0 = (height - side) / 2 / height,
    x1 = 1 - x0,
    y1 = 1 - y0;
  return Object.freeze([
    Object.freeze({ x: x0, y: y0 }),
    Object.freeze({ x: x1, y: y0 }),
    Object.freeze({ x: x1, y: y1 }),
    Object.freeze({ x: x0, y: y1 }),
  ]) as unknown as Quad;
}
export type FrameIssue = "dark" | "bright" | "glare";
export const FRAME_ISSUES: Record<FrameIssue, string> = {
  dark: "Ảnh quá tối: tăng ánh sáng hoặc đưa khối lại gần nguồn sáng.",
  bright: "Ảnh quá sáng: giảm đèn hoặc tránh nắng chiếu thẳng.",
  glare: "Có vùng lóa: nghiêng khối nhẹ để tránh phản chiếu trên sticker.",
};
/**
 * Cheap lighting check over the guide area (luma on a 24×24 grid). It only
 * warns; the user still reviews every color before it reaches the solver.
 */
export function assessFrame(image: PixelImage, crop: Quad): FrameIssue[] {
  const luma: number[] = [];
  let clipped = 0;
  const n = 24;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const p = project({ x: (i + 0.5) / n, y: (j + 0.5) / n }, crop);
      const x = Math.min(
          image.width - 1,
          Math.max(0, Math.round(p.x * (image.width - 1))),
        ),
        y = Math.min(
          image.height - 1,
          Math.max(0, Math.round(p.y * (image.height - 1))),
        );
      const k = (y * image.width + x) * 4,
        r = image.data[k],
        g = image.data[k + 1],
        b = image.data[k + 2];
      luma.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
      if (r > 250 && g > 250 && b > 250) clipped++;
    }
  // A solved face is one color, so low contrast alone is not a problem.
  const mean = luma.reduce((a, b) => a + b, 0) / luma.length;
  const issues: FrameIssue[] = [];
  if (mean < 45) issues.push("dark");
  else if (mean > 225) issues.push("bright");
  if (clipped / luma.length > 0.08) issues.push("glare");
  return issues;
}
type FrameSource = Readonly<{
  width: number;
  height: number;
  draw: (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => void;
}>;
/** Copy the current frame into a bounded raster with the guide as crop. */
export function captureFrame(
  frame: FrameSource,
  createCanvas: () => HTMLCanvasElement = () =>
    document.createElement("canvas"),
): ImageSource {
  if (frame.width < 90 || frame.height < 90)
    throw Error("Camera chưa sẵn sàng. Đợi hình hiện rõ rồi chụp lại.");
  const scale = Math.min(
      1,
      MAX_RETAINED_EDGE / Math.max(frame.width, frame.height),
    ),
    canvas = createCanvas();
  canvas.width = Math.round(frame.width * scale);
  canvas.height = Math.round(frame.height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context)
    throw Error("Không đọc được hình từ camera trong trình duyệt này.");
  frame.draw(context, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  return {
    image: { width: pixels.width, height: pixels.height, data: pixels.data },
    preview: canvas.toDataURL("image/png"),
    crop: guideQuad(canvas.width, canvas.height),
    turns: 0,
  };
}
