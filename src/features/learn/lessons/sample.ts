import type { LessonSource } from "./schema";
/** Explicit facelet fixtures. U-turn state also appears in the independent cube oracle corpus. */
const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
const U_TURN = "UUUUUUUUUBBBRRRRRRRRRFFFFFFDDDDDDDDDFFFLLLLLLLLLBBBBBB";
export const SAMPLE_LESSON_SOURCE: LessonSource = {
  schemaVersion: 1,
  contentVersion: 1,
  id: "intro-u-turn",
  slug: "lam-quen-u-va-u-prime",
  puzzleId: "3x3",
  status: "published",
  orientation: "white-up-green-front",
  title: "Làm quen với U và U′",
  summary:
    "Quan sát mặt trên, thực hiện một nước U rồi dùng U′ để trở về trạng thái ban đầu. Bài tập giúp đọc ký hiệu và quan sát cách đảo một nước xoay.",
  prerequisiteIds: [],
  objectives: [
    {
      id: "read-u",
      description:
        "Xác định mặt U và đọc chiều xoay khi nhìn thẳng từ bên ngoài mặt đó.",
    },
    {
      id: "undo-u",
      description:
        "Dùng U′ để đảo nước U và kiểm tra khối trở lại trạng thái đầu.",
    },
  ],
  initialState: SOLVED,
  finalState: SOLVED,
  steps: [
    {
      id: "observe-u",
      title: "Giữ đúng hướng khối",
      kind: "observe",
      instructions: [
        "Giữ tâm trắng ở trên (U), tâm xanh lá phía trước (F).",
        "Quan sát mặt trên; chưa xoay mặt nào trong bước này.",
      ],
      objectiveIds: ["read-u"],
      algorithm: "",
      before: SOLVED,
      after: SOLVED,
    },
    {
      id: "turn-u",
      title: "Thực hiện U",
      kind: "moves",
      instructions: [
        "Nhìn mặt U từ bên ngoài, xoay tầng trên 90° theo chiều kim đồng hồ.",
        "Chỉ tầng trên thay đổi; giữ nguyên hướng của cả khối.",
      ],
      objectiveIds: ["read-u"],
      algorithm: "U",
      before: SOLVED,
      after: U_TURN,
    },
    {
      id: "undo-u",
      title: "Đảo bằng U′",
      kind: "moves",
      instructions: [
        "Xoay mặt U ngược chiều kim đồng hồ khi nhìn trực diện mặt đó.",
        "So sánh sáu mặt với đầu bài: U rồi U′ trả khối về trạng thái ban đầu.",
      ],
      objectiveIds: ["undo-u"],
      algorithm: "U'",
      before: U_TURN,
      after: SOLVED,
    },
  ],
};
