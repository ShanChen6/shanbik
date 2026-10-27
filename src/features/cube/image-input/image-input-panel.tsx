"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CUBE_COLORS, FACE_COLORS, FACE_ORDER } from "../core/constants";
import type { CubeFace } from "../core/types";
import {
  FACE_GUIDES,
  paintSticker,
  type FaceDraft,
  type StickerInput,
} from "../face-input/draft";
import {
  COLOR_LABELS,
  STICKER_COLORS,
  COLOR_ABBREVIATIONS,
} from "../viewer/palette";
import { decodeImage } from "../../puzzle-image/decode";
import { project, validQuad } from "../../puzzle-image/geometry";
import type { ImageSource, Point, Quad } from "../../puzzle-image/types";
import {
  allImagesPresent,
  recognizeCubeImages,
  type ImageResult,
  type Sources,
} from "./adapter";
import { CUBE_3_IMAGE_PROFILE } from "./profile";

const CORNERS = ["Trên trái", "Trên phải", "Dưới phải", "Dưới trái"];
export function ImageInputPanel({
  onImport,
}: {
  onImport: (draft: FaceDraft) => void;
}) {
  const id = useId();
  const [sources, setSources] = useState<Sources>({});
  const [face, setFace] = useState<CubeFace>("U");
  const [corner, setCorner] = useState(0);
  const [busy, setBusy] = useState<CubeFace | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ImageResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const job = useRef({ id: 0 });
  const loading = useRef(false);
  const alive = useRef(false);
  const decoder = useRef<AbortController | null>(null);
  useEffect(() => {
    const lifetime = job.current;
    alive.current = true;
    return () => {
      alive.current = false;
      lifetime.id++;
      decoder.current?.abort();
      loading.current = false;
      setBusy(null);
      setSources({});
      setResult(null);
      setConfirmed(false);
      setMessage("");
    };
  }, []);
  const resetResult = () => {
    setResult(null);
    setConfirmed(false);
    setError("");
    setMessage("");
  };
  const load = async (selected: CubeFace, file: File) => {
    if (loading.current) return;
    loading.current = true;
    const ticket = ++job.current.id;
    resetResult();
    setBusy(selected);
    decoder.current = new AbortController();
    try {
      const source = await decodeImage(file, decoder.current.signal);
      if (!alive.current || ticket !== job.current.id) return;
      setSources((current) => ({ ...current, [selected]: source }));
      setFace(selected);
      setMessage(
        `Đã đọc ảnh mặt ${selected}. Chỉnh bốn góc bao quanh đúng một mặt.`,
      );
    } catch (reason) {
      if (alive.current && ticket === job.current.id)
        setError(
          reason instanceof Error ? reason.message : "Không đọc được ảnh.",
        );
    } finally {
      if (alive.current && ticket === job.current.id) {
        loading.current = false;
        setBusy(null);
      }
    }
  };
  const update = (source: ImageSource) => {
    setSources((current) => ({ ...current, [face]: source }));
    resetResult();
  };
  const source = sources[face];
  const cropValid = source ? validQuad(source.crop) : false;
  const cells = CUBE_3_IMAGE_PROFILE.faces.find(
    (item) => item.id === face,
  )!.cells;
  const setPoint = (point: Point) => {
    if (!source || busy) return;
    update({
      ...source,
      crop: source.crop.map((old, index) =>
        index === corner ? point : old,
      ) as unknown as Quad,
    });
  };
  const unknown = result
    ? FACE_ORDER.reduce(
        (count, key) =>
          count + result.draft[key].filter((value) => !value).length,
        0,
      )
    : 0;
  return (
    <details
      id="cube-image-input"
      className="min-w-0 space-y-4 rounded-panel border border-border p-3"
      aria-label="Nhập Rubik từ ảnh"
    >
      <summary className="cursor-pointer font-semibold">
        Nhập từ ảnh — 3×3
      </summary>
      <p className="text-sm text-muted">
        Chọn sáu ảnh, mỗi ảnh nhìn thẳng vào một mặt, tránh bóng và phản chiếu.
        JPEG/PNG/WebP tối đa 8 MiB, 24 MP mỗi ảnh; cạnh lưu để xử lý tối đa
        1024px. Ảnh chỉ xử lý trong trình duyệt, không tải lên máy chủ và không
        lưu qua reload. Chưa hỗ trợ camera trực tiếp hoặc tự tìm khối trong ảnh.
      </p>
      <p className="text-sm text-muted">
        Giữ đúng tâm: U trắng, R đỏ, F xanh lá, D vàng, L cam, B xanh dương. Tâm
        của từng ảnh làm mẫu màu cho nhận dạng; chọn nhầm mặt hoặc ánh sáng khác
        nhau vẫn có thể nhận sai. Luôn kiểm tra lại bằng mắt.
      </p>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        {FACE_ORDER.map((key) => (
          <label
            key={key}
            className="flex min-w-0 flex-col gap-1 text-sm font-semibold"
          >
            Ảnh mặt {key} — tâm {COLOR_LABELS[FACE_COLORS[key]]}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={!!busy}
              className="ui-input min-w-0 max-w-full text-xs"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void load(key, file);
              }}
            />
            <span className="font-normal text-muted">
              {sources[key] ? "Đã có ảnh" : "Chưa chọn ảnh"}
            </span>
          </label>
        ))}
      </div>
      <div
        role="group"
        aria-label="Chọn mặt để chỉnh ảnh"
        className="flex flex-wrap gap-2"
      >
        {FACE_ORDER.map((key) => (
          <Button
            key={key}
            variant="secondary"
            aria-pressed={face === key}
            onClick={() => {
              setFace(key);
              setCorner(0);
            }}
          >
            {key}
          </Button>
        ))}
      </div>
      <p role="status" className="text-sm text-muted">
        {busy ? `Đang đọc ảnh mặt ${busy}…` : message}
      </p>
      {source && (
        <div
          className="min-w-0 space-y-3"
          aria-label={`Chỉnh ảnh mặt ${face}`}
          role="group"
        >
          <p className="text-sm">
            Mặt {face}: cạnh trên {FACE_GUIDES[face].top}, trái{" "}
            {FACE_GUIDES[face].left}, phải {FACE_GUIDES[face].right}, dưới{" "}
            {FACE_GUIDES[face].bottom}. Không phản chiếu mặt B. Đặt bốn góc theo
            ảnh gốc; nút xoay đổi thứ tự ô để đúng hướng mặt.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            Góc đang chọn
            <select
              className="ui-input"
              value={corner}
              onChange={(event) => setCorner(Number(event.target.value))}
            >
              {CORNERS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <p id={`${id}-crop-help`} className="text-sm text-muted">
            Chạm ảnh để đặt góc đang chọn, hoặc nhập X/Y (%) bên dưới. Bốn góc
            phải bao quanh mép ngoài của một mặt theo thứ tự trên trái → trên
            phải → dưới phải → dưới trái; số trên lưới là thứ tự ô sau xoay.
          </p>
          <svg
            role="img"
            aria-label={`Ảnh và lưới mặt ${face}`}
            aria-describedby={`${id}-crop-help`}
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            className="block w-full rounded-sm border border-border"
            style={{
              aspectRatio: `${source.image.width}/${source.image.height}`,
            }}
            onPointerDown={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              setPoint({
                x: Math.max(
                  0,
                  Math.min(1, (event.clientX - bounds.left) / bounds.width),
                ),
                y: Math.max(
                  0,
                  Math.min(1, (event.clientY - bounds.top) / bounds.height),
                ),
              });
            }}
          >
            <image href={source.preview} x={0} y={0} width={1} height={1} />
            {cropValid &&
              cells.map((cell, index) => {
                const points = cell.polygon.map((point) =>
                  project(point, source.crop, source.turns),
                );
                const center = project(
                  cell.samples[12],
                  source.crop,
                  source.turns,
                );
                return (
                  <g key={cell.id}>
                    <polygon
                      points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke="#111827"
                      strokeWidth={0.008}
                    />
                    <polygon
                      points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={0.003}
                    />
                    <text
                      x={center.x}
                      y={center.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={0.055}
                      fill="#ffffff"
                      stroke="#111827"
                      strokeWidth={0.002}
                      paintOrder="stroke"
                    >
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            {source.crop.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={0.016}
                fill={index === corner ? "#f97316" : "#ffffff"}
                stroke="#111827"
                strokeWidth={0.004}
              />
            ))}
          </svg>
          <div className="grid grid-cols-2 gap-2">
            {(["x", "y"] as const).map((axis) => (
              <label key={axis} className="text-sm">
                {axis.toUpperCase()} góc {CORNERS[corner]} (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  disabled={!!busy}
                  className="ui-input"
                  value={Math.round(source.crop[corner][axis] * 1000) / 10}
                  onChange={(event) => {
                    const value = event.target.valueAsNumber;
                    if (Number.isFinite(value))
                      setPoint({
                        ...source.crop[corner],
                        [axis]: Math.max(0, Math.min(100, value)) / 100,
                      });
                  }}
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!!busy}
              onClick={() =>
                update({ ...source, turns: (source.turns + 1) % 4 })
              }
            >
              Xoay thứ tự ô 90°
            </Button>
            <Button
              variant="secondary"
              disabled={!!busy}
              onClick={() => {
                setSources((current) => {
                  const copy = { ...current };
                  delete copy[face];
                  return copy;
                });
                resetResult();
              }}
            >
              Bỏ ảnh mặt {face}
            </Button>
          </div>
          <p className="text-sm text-muted">
            Đã xoay thứ tự ô {source.turns * 90}°. Tâm vẫn là ô 5.
          </p>
          {!cropValid && (
            <p role="alert" className="text-sm text-danger">
              Bốn góc chưa tạo thành vùng lồi hợp lệ hoặc vùng quá nhỏ. Hãy
              chỉnh lại trước khi nhận màu.
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={
            !!busy ||
            !allImagesPresent(sources) ||
            !FACE_ORDER.every(
              (key) => sources[key] && validQuad(sources[key]!.crop),
            )
          }
          onClick={() => {
            resetResult();
            try {
              setResult(recognizeCubeImages(sources));
              setMessage(
                "Đã lấy mẫu màu. Kiểm tra từng ô và sửa trước khi chuyển.",
              );
            } catch (reason) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Chưa nhận dạng được ảnh.",
              );
            }
          }}
        >
          Nhận màu từ sáu ảnh
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            job.current.id++;
            decoder.current?.abort();
            loading.current = false;
            setBusy(null);
            setSources({});
            resetResult();
            setMessage(
              "Đã bỏ toàn bộ ảnh và kết quả ảnh. Bản nhập tay giữ nguyên.",
            );
          }}
        >
          Xóa toàn bộ ảnh
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {result && (
        <div
          role="group"
          aria-label="Kiểm tra màu nhận từ ảnh"
          className="space-y-4"
        >
          <p role="status" className="text-sm">
            Còn {unknown} ô chưa chắc chắn/chưa chọn màu. Ô trống cần sửa tay;
            nhận dạng màu chưa xác nhận trạng thái có thể giải.
          </p>
          <p className="text-xs text-muted">
            Tr: Trắng · Đ: Đỏ · XL: Xanh lá · V: Vàng · C: Cam · XD: Xanh dương
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {FACE_ORDER.map((key) => (
              <fieldset
                key={key}
                className="min-w-0 rounded-sm border border-border p-2"
              >
                <legend>Mặt {key}</legend>
                <div className="grid grid-cols-3 gap-1">
                  {result.draft[key].map((color, index) => (
                    <label key={index} className="min-w-0 text-xs">
                      <span>
                        {index + 1}
                        {index === 4 ? " (tâm)" : !color ? " — sửa" : ""}
                      </span>
                      <select
                        aria-label={`Màu ảnh ${key} ô ${index + 1}`}
                        disabled={index === 4}
                        value={color ?? ""}
                        className="ui-input px-1 text-xs"
                        style={{
                          borderColor: color
                            ? STICKER_COLORS[color]
                            : undefined,
                        }}
                        onChange={(event) => {
                          const value = (event.target.value ||
                            null) as StickerInput;
                          setResult((current) =>
                            current
                              ? {
                                  ...current,
                                  draft: paintSticker(
                                    current.draft,
                                    key,
                                    index,
                                    value,
                                  ),
                                }
                              : null,
                          );
                          setConfirmed(false);
                        }}
                      >
                        <option value="">Chưa rõ</option>
                        {CUBE_COLORS.map((value) => (
                          <option
                            key={value}
                            value={value}
                            aria-label={COLOR_LABELS[value]}
                          >
                            {COLOR_ABBREVIATIONS[value]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 size-5 shrink-0"
            />
            Tôi đã kiểm tra đúng tâm, hướng sáu mặt và các màu nhận được.
          </label>
          <p className="text-sm text-muted">
            Chuyển sẽ thay bản nhập thủ công và bỏ lời giải cũ. Mô hình/player
            chưa thay đổi. Ô chưa rõ vẫn trống để sửa; sau đó dùng Kiểm tra khối
            hoặc Giải bản nhập.
          </p>
          <Button
            disabled={!confirmed || !!busy}
            onClick={() => {
              onImport(result.draft);
              setConfirmed(false);
              setMessage(
                "Đã chuyển màu sang bản nhập bên dưới. Kiểm tra/sửa rồi nhấn Giải bản nhập.",
              );
            }}
          >
            Chuyển màu sang bản nhập
          </Button>
        </div>
      )}
    </details>
  );
}
