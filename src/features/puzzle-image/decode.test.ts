import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodeImage, MAX_FILE_BYTES } from "./decode";
class FakeImage {
  src = "";
  naturalWidth = 180;
  naturalHeight = 120;
  decode() {
    return Promise.resolve();
  }
}
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const revoked = vi.fn(),
  created = vi.fn(() => "blob:fixture");
beforeEach(() => {
  vi.stubGlobal("Image", FakeImage);
  vi.spyOn(URL, "createObjectURL").mockImplementation(created);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(revoked);
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: vi.fn(),
      getImageData: () => ({
        width: 180,
        height: 120,
        data: new Uint8ClampedArray(180 * 120 * 4),
      }),
    }),
    toDataURL: () => "data:image/png;base64,fixture",
  };
  vi.stubGlobal("document", { createElement: () => canvas });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("bounded local raster decoding", () => {
  it.each(["image/svg+xml", "image/gif", "image/heic", "text/html"])(
    "rejects %s before creating any object URL",
    async (type) => {
      await expect(
        decodeImage(new File(["x"], "file", { type })),
      ).rejects.toThrow(/Chỉ nhận/);
      expect(created).not.toHaveBeenCalled();
    },
  );
  it("rejects oversized and empty files without decoding", async () => {
    await expect(
      decodeImage(
        new File([new Uint8Array(MAX_FILE_BYTES + 1)], "large.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toThrow(/8 MiB/);
    await expect(
      decodeImage(new File([], "empty.png", { type: "image/png" })),
    ).rejects.toThrow();
    expect(created).not.toHaveBeenCalled();
  });
  it("rejects renamed SVG content even when the MIME claims PNG", async () => {
    await expect(
      decodeImage(new File(["<svg/ >"], "fake.png", { type: "image/png" })),
    ).rejects.toThrow(/chữ ký/);
    expect(created).not.toHaveBeenCalled();
  });
  it("revokes its object URL after successful decode", async () => {
    const result = await decodeImage(
      new File([PNG], "photo.png", { type: "image/png" }),
    );
    expect(result.image.width).toBe(180);
    expect(revoked).toHaveBeenCalledWith("blob:fixture");
  });
  it("revokes even when decode fails", async () => {
    vi.spyOn(FakeImage.prototype, "decode").mockRejectedValueOnce(Error("bad"));
    await expect(
      decodeImage(new File([PNG], "bad.png", { type: "image/png" })),
    ).rejects.toThrow(/Không đọc/);
    expect(revoked).toHaveBeenCalledOnce();
  });
  it("does not start an already-aborted decode", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      decodeImage(
        new File([PNG], "photo.png", { type: "image/png" }),
        controller.signal,
      ),
    ).rejects.toThrow();
    expect(created).not.toHaveBeenCalled();
  });
  it("revokes a decode aborted while pending", async () => {
    let resolve: () => void = () => {};
    vi.spyOn(FakeImage.prototype, "decode").mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const controller = new AbortController();
    const decoding = decodeImage(
      new File([PNG], "photo.png", { type: "image/png" }),
      controller.signal,
    );
    await vi.waitFor(() => expect(created).toHaveBeenCalledOnce());
    controller.abort();
    resolve();
    await expect(decoding).rejects.toThrow();
    expect(revoked).toHaveBeenCalledOnce();
  });
});
