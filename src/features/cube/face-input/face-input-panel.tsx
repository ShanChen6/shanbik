"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ImageInputPanel } from "../image-input/image-input-panel";
import { createSolverController } from "../solver/controller";
import type { VerifiedSolution } from "../solver/verify-solution";
import { SolverPanel } from "../solver/solver-panel";
import { Button } from "@/components/ui/button";
import { CENTER_INDEX, CUBE_COLORS, FACE_ORDER } from "../core/constants";
import { validateCubeFeasibility } from "../core/feasibility";
import { isCubeSolved, createSolvedCubeState } from "../core/state";
import {
  COLOR_LABELS,
  STICKER_COLORS,
  COLOR_ABBREVIATIONS as ABBREVIATIONS,
} from "../viewer/palette";
import {
  createFaceDraft,
  FACE_GUIDES,
  inspectFaceDraft,
  paintSticker,
  type StickerInput,
  type FaceDraft,
} from "./draft";

export function FaceInputPanel({
  solver,
  canLoad,
  onLoad,
  canCapture,
  capture,
}: {
  solver: ReturnType<typeof createSolverController>;
  canLoad: boolean;
  canCapture: boolean;
  capture: () => FaceDraft | null;
  onLoad: (solution: VerifiedSolution) => boolean;
}) {
  const id = useId();
  const solverSnapshot = useSyncExternalStore(
    solver.subscribe,
    solver.getSnapshot,
    solver.getServerSnapshot,
  );
  useEffect(() => () => solver.release(), [solver]);
  const [draft, setDraft] = useState(() => createFaceDraft());
  const [color, setColor] = useState<StickerInput>("white");
  const [checked, setChecked] = useState(false);
  const [notice, setNotice] = useState("");
  const cells = useRef<Record<string, HTMLButtonElement | null>>({});
  const report = inspectFaceDraft(draft);
  const feasibility =
    checked && report.state ? validateCubeFeasibility(report.state) : null;
  const affected = new Set(
    feasibility && !feasibility.valid
      ? feasibility.issues.flatMap((issue) =>
          issue.stickers.map((cell) => `${cell.face}-${cell.index}`),
        )
      : [],
  );
  const edit = () => {
    solver.invalidate();
    setChecked(false);
    setNotice("");
  };
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="mt-8 min-w-0 space-y-4 border-t border-border pt-6"
    >
      <h3 id={`${id}-title`} className="text-xl font-bold">
        Nhập màu sáu mặt
      </h3>
      <p className="text-sm text-muted">
        Giữ tâm trắng (U) ở trên, tâm xanh lá (F) phía trước: đỏ (R) bên phải,
        cam (L) bên trái, xanh dương (B) phía sau, vàng (D) phía dưới.
      </p>
      <p id={`${id}-guide`} className="text-sm text-muted">
        Mỗi lưới nhìn thẳng từ bên ngoài mặt đó, đọc trái sang phải, trên xuống
        dưới. Xoay cả khối để nhìn mặt cần nhập, không xoay riêng tầng. Đặt mặt
        kề ghi ở “cạnh trên” lên phía trên lưới; mặt B không phản chiếu. Chọn
        màu tô rồi nhấn ô để điền hoặc sửa; chọn “Xóa ô” để bỏ màu. Màu tô dùng
        chung cho sáu mặt. Ô tâm cố định.
      </p>
      <ImageInputPanel
        onImport={(imported) => {
          edit();
          setDraft(imported);
          setNotice(
            "Đã nhận màu từ ảnh. Kiểm tra và sửa các ô trước khi giải; mô hình chưa thay đổi.",
          );
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!canCapture}
          onClick={() => {
            const captured = capture();
            if (!captured) return;
            edit();
            setDraft(captured);
            setNotice(
              "Đã lấy màu từ mô hình đang dừng. Bản nhập là bản sao riêng; nhấn Giải bản nhập để tiếp tục.",
            );
          }}
        >
          Lấy màu từ mô hình
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setDraft(createFaceDraft(createSolvedCubeState()));
            edit();
            setNotice("Đã điền mẫu solved. Bạn có thể sửa từng ô.");
          }}
        >
          Điền mẫu solved
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setDraft(createFaceDraft());
            edit();
            setNotice("Đã xóa 48 ô ngoài tâm.");
          }}
        >
          Xóa màu đã nhập
        </Button>
      </div>
      <p className="text-sm text-muted">
        Lấy màu sẽ thay bản nhập hiện tại. Chỉ lấy khi 3D sẵn sàng và không còn
        nước đang chạy hoặc chờ; có thể lấy ở một bước đang dừng của player.
      </p>
      <div
        role="group"
        aria-label="Số lượng từng màu"
        className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3"
      >
        {CUBE_COLORS.map((value) => (
          <p key={value} className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className="h-4 w-4 shrink-0 rounded-sm border border-black/40"
              style={{ backgroundColor: STICKER_COLORS[value] }}
            />
            {COLOR_LABELS[value]} ({ABBREVIATIONS[value]}):{" "}
            {report.counts[value]}/9{report.counts[value] > 9 ? " — thừa" : ""}
          </p>
        ))}
      </div>
      <p role="status" className="text-sm text-muted">
        Đã nhập {54 - report.missing.length}/54 ô (gồm 6 tâm). {notice}
      </p>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        {FACE_ORDER.map((face) => {
          const guide = FACE_GUIDES[face];
          const missingCount = report.missing.filter(
            (cell) => cell.face === face,
          ).length;
          return (
            <fieldset
              key={face}
              aria-describedby={`${id}-${face}-guide`}
              className="min-w-0 space-y-3 rounded-panel border border-border p-3"
            >
              <legend className="px-1 font-semibold">
                {face} — {guide.name}
              </legend>
              <p id={`${id}-${face}-guide`} className="text-xs text-muted">
                Cạnh trên: {guide.top} · trái: {guide.left} · phải:{" "}
                {guide.right} · dưới: {guide.bottom}. Còn thiếu {missingCount}{" "}
                ô.
              </p>
              <div className="text-sm">
                <label htmlFor={`${id}-${face}-paint`}>Màu tô mặt {face}</label>
                <select
                  id={`${id}-${face}-paint`}
                  className="ui-input mt-1"
                  value={color ?? "empty"}
                  onChange={(event) =>
                    setColor(
                      event.target.value === "empty"
                        ? null
                        : (event.target.value as StickerInput),
                    )
                  }
                >
                  <option value="empty">Xóa ô (chưa nhập)</option>
                  {CUBE_COLORS.map((value) => (
                    <option key={value} value={value}>
                      {COLOR_LABELS[value]} ({ABBREVIATIONS[value]})
                    </option>
                  ))}
                </select>
              </div>
              <div
                role="group"
                aria-label={`Lưới mặt ${face}`}
                className="mx-auto grid w-full max-w-60 grid-cols-3 gap-2"
              >
                {draft[face].map((value, index) => {
                  const center = index === CENTER_INDEX;
                  const label = `Mặt ${face}, hàng ${Math.floor(index / 3) + 1}, cột ${(index % 3) + 1}: ${value ? COLOR_LABELS[value] : "chưa nhập"}${center ? ", tâm cố định" : ""}`;
                  return (
                    <button
                      key={index}
                      type="button"
                      ref={(element) => {
                        cells.current[`${face}-${index}`] = element;
                      }}
                      disabled={center}
                      aria-label={label}
                      aria-describedby={
                        checked && (!value || affected.has(`${face}-${index}`))
                          ? `${id}-errors`
                          : undefined
                      }
                      className={`aspect-square min-h-11 min-w-11 rounded-sm border-2 text-sm font-bold ${checked && (!value || affected.has(`${face}-${index}`)) ? "border-danger" : "border-black/40"}`}
                      style={{
                        backgroundColor: value
                          ? STICKER_COLORS[value]
                          : undefined,
                        color: value
                          ? value === "red" || value === "blue"
                            ? "#ffffff"
                            : "#111827"
                          : undefined,
                      }}
                      onClick={() => {
                        setDraft((current) =>
                          paintSticker(current, face, index, color),
                        );
                        edit();
                      }}
                    >
                      {center ? face : value ? ABBREVIATIONS[value] : "?"}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
      <Button
        onClick={() => {
          setChecked(true);
          setNotice("");
        }}
      >
        Kiểm tra khối
      </Button>
      {checked &&
        (feasibility ? (
          feasibility.valid ? (
            <p role="status" className="text-sm">
              Trạng thái khả thi với khối 3×3 theo quy ước tâm hiện tại: đủ
              cubie, hướng cạnh/góc và parity đúng.{" "}
              {isCubeSolved(feasibility.state)
                ? "Khối đã solved."
                : "Khối chưa solved."}{" "}
              Mô hình đang phát không thay đổi.
            </p>
          ) : (
            <div
              id={`${id}-errors`}
              role="alert"
              className="space-y-3 text-sm text-danger"
            >
              <p>
                Đủ số màu, nhưng trạng thái không khả thi. Nội dung được giữ
                nguyên để sửa.
              </p>
              <p>
                Ô đánh dấu là các vị trí liên quan để kiểm tra, không phải khẳng
                định duy nhất ô nhập sai.
              </p>
              <ul className="space-y-3">
                {feasibility.issues.map((issue, index) => (
                  <li
                    key={index}
                    data-code={issue.code}
                    className="break-words"
                  >
                    {issue.message}
                    {issue.stickers.length > 0 && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const first = issue.stickers[0];
                          cells.current[
                            `${first.face}-${first.index}`
                          ]?.focus();
                        }}
                      >
                        Đến ô liên quan lỗi {index + 1}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : (
          <div
            id={`${id}-errors`}
            role="alert"
            className="space-y-2 text-sm text-danger"
          >
            <p>
              Chưa đủ điều kiện về ô và số lượng màu. Nội dung đã nhập được giữ
              nguyên.
            </p>
            {report.missing.length > 0 && (
              <p>
                Còn thiếu {report.missing.length} ô.{" "}
                <Button
                  variant="ghost"
                  onClick={() => {
                    const first = report.missing[0];
                    cells.current[`${first.face}-${first.index}`]?.focus();
                  }}
                >
                  Đến ô chưa nhập đầu tiên
                </Button>
              </p>
            )}
            <ul>
              {CUBE_COLORS.filter((value) => report.counts[value] !== 9).map(
                (value) => (
                  <li key={value}>
                    {COLOR_LABELS[value]}: {report.counts[value]}/9 —{" "}
                    {report.counts[value] < 9
                      ? `thiếu ${9 - report.counts[value]}`
                      : `thừa ${report.counts[value] - 9}`}{" "}
                    ô.
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      <SolverPanel
        controller={solver}
        snapshot={solverSnapshot}
        canLoad={canLoad}
        onLoad={() => {
          const result = solver.getSnapshot().result;
          if (result && onLoad(result)) {
            setNotice(
              "Đã nạp bản nhập và lời giải vào player. Dùng Phát chuỗi hoặc Bước tiếp ở mô hình phía trên.",
            );
          }
        }}
        onSolve={() => {
          setChecked(true);
          solver.solve({ faces: draft });
        }}
      />
      <p className="text-sm text-muted">
        Bản nhập giữ trong trang, không tự đổi mô hình hoặc chuỗi đang phát và
        không lưu qua reload. Đủ 9 ô mỗi màu chưa chứng minh khối có thể giải.
        Nút Giải bản nhập kiểm tra lại tính khả thi trước khi chạy Worker. Sửa
        màu hoặc rời trang sẽ bỏ kết quả cũ.
      </p>
    </section>
  );
}
