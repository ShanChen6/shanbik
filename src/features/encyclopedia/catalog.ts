import { PUBLISHED_LESSON_LINKS } from "../learn/lessons/publication";
import {
  CAPABILITIES,
  parseCatalog,
  type Capability,
  type CapabilityKey,
  type Difficulty,
  type Puzzle,
  type Shape,
} from "./schema";
const wca = (section: string) => ({
  title: "WCA — ký hiệu chính thức",
  href: `https://www.worldcubeassociation.org/regulations/#${section}`,
});
const available: Record<CapabilityKey, Capability> = {
  viewer: {
    status: "available",
    note: "Mô hình 3×3 với orbit/zoom; cần WebGL.",
  },
  scramble: {
    status: "available",
    note: "25 nước random-move để luyện tập, không phải scramble thi đấu chính thức.",
  },
  solver: {
    status: "available",
    note: "cubing.js trong Worker; kiểm tra trạng thái và kiểm chứng lời giải trước khi hiển thị.",
  },
  imageInput: {
    status: "available",
    note: "Sáu ảnh tĩnh, crop và duyệt/sửa màu; chưa quét camera trực tiếp.",
  },
  player: {
    status: "available",
    note: "Phát, tiến/lùi, về đầu chuỗi; hỗ trợ grammar 3×3 hiện có.",
  },
  lessons: {
    status: "available",
    note: "Có bài U/U′ với minh họa 3D, sơ đồ màu 2D và tự lưu vị trí đọc cục bộ.",
  },
};
const unavailable = (name: string) =>
  Object.fromEntries(
    Object.keys(CAPABILITIES).map((key) => [
      key,
      {
        status: "unavailable",
        note: `Chưa triển khai ${CAPABILITIES[key as CapabilityKey].toLocaleLowerCase("vi")} cho ${name} trên ShanBik.`,
      },
    ]),
  ) as Record<CapabilityKey, Capability>;
function entry(
  slug: string,
  name: string,
  shape: Shape,
  layers: number | null,
  difficulty: Difficulty,
  summary: string,
  description: readonly string[],
  notation: string,
  examples: string[],
  section: string,
  aliases: string[],
): Puzzle {
  return {
    slug,
    name,
    shape,
    layers,
    difficulty,
    summary,
    description,
    aliases,
    notation: { summary: notation, examples, source: wca(section) },
    capabilities: slug === "3x3" ? available : unavailable(name),
    relatedReading:
      slug === "3x3"
        ? [
            { title: "Kiến thức nhập môn 3×3", href: "/learn" },
            { title: "Bắt đầu nhanh với ShanBik", href: "/help#quick-start" },
          ]
        : [],
    relatedLessons: PUBLISHED_LESSON_LINKS.filter(
      (lesson) => lesson.puzzleId === slug,
    ).map(({ title, href }) => ({ title, href })),
  };
}
export const PUZZLES = parseCatalog([
  entry(
    "3x3",
    "Rubik 3×3",
    "cube",
    3,
    "beginner",
    "Khối lập phương quen thuộc, nền tảng cho phần luyện tập hiện tại.",
    [
      "Mỗi mặt có lưới 3×3. Nhóm tâm, cạnh và góc giúp bạn theo dõi vị trí và hướng của từng mảnh.",
      "ShanBik dùng tâm trắng ở U và xanh lá ở F. Có thể nhập màu bằng tay, lấy từ mô hình hoặc nhập sáu ảnh; mọi trạng thái đều qua kiểm tra khả thi trước solver.",
    ],
    "U/R/F/D/L/B; dấu prime đảo chiều và 2 là nửa vòng. Grammar ShanBik hiện chưa nhận wide move, rotation hoặc nhóm lặp.",
    ["R", "U'", "F2"],
    "12a",
    ["3x3", "3 x 3", "3x3x3", "333", "rubik", "cube"],
  ),
  entry(
    "2x2",
    "Rubik 2×2",
    "cube",
    2,
    "beginner",
    "Khối nhỏ tập trung vào việc nhận biết các mảnh góc.",
    [
      "Mỗi mặt có lưới 2×2. Không có nhóm cạnh và tâm như trên khối 3×3.",
      "Mục này giới thiệu puzzle. Viewer, nhập trạng thái và solver 2×2 chưa được nối vào giao diện luyện tập.",
    ],
    "Ký hiệu mặt ngoài thuộc nhóm NxN; không đưa chuỗi 2×2 vào player 3×3 để thay thế model.",
    ["R", "U'", "F2"],
    "12a",
    ["2x2", "2x2x2", "222", "pocket cube"],
  ),
  entry(
    "4x4",
    "Rubik 4×4",
    "cube",
    4,
    "intermediate",
    "Lưới 4×4 bổ sung các nhóm tâm và nhiều mảnh cạnh hơn.",
    [
      "Một hướng tiếp cận là gom tâm và ghép cạnh trước khi xử lý phần còn lại. Không nên suy ra hướng các mặt chỉ từ một ô tâm riêng lẻ.",
      "Nhập ảnh 3×3 không thể dùng trực tiếp cho khối này. Cần profile ảnh, biểu diễn trạng thái và validation riêng trước khi mở tính năng luyện tập.",
    ],
    "NxN còn có wide move như Rw; grammar 3×3 hiện tại trên ShanBik không nhận ký hiệu này.",
    ["Rw", "U2"],
    "12a",
    ["4x4", "4x4x4", "444", "rubiks revenge"],
  ),
  entry(
    "5x5",
    "Rubik 5×5",
    "cube",
    5,
    "intermediate",
    "Lưới 5×5 với nhiều mảnh tâm và cạnh cần theo dõi.",
    [
      "Khối 5×5 có nhiều mảnh trên mỗi mặt hơn 3×3. Việc gom nhóm tâm và cạnh là một phần của quá trình học.",
      "Nền tảng lấy mẫu ảnh có geometry NxN, nhưng chưa có adapter ảnh, validation hoặc solver 5×5 trên ShanBik.",
    ],
    "Dùng quy ước NxN, bao gồm các nước nhiều tầng khi cần. Không áp dụng bộ parser 3×3 hiện tại cho toàn bộ notation này.",
    ["Rw", "3Rw", "U2"],
    "12a",
    ["5x5", "5x5x5", "555", "professors cube"],
  ),
  entry(
    "pyraminx",
    "Pyraminx",
    "tetrahedron",
    null,
    "beginner",
    "Puzzle dạng tứ diện với quy tắc xoay và nhận diện mặt riêng.",
    [
      "Các mặt tam giác và phần chóp khiến cách đọc trạng thái khác khối lập phương NxN.",
      "Trước khi nhập ảnh cần có profile chia ô tam giác và cách xác định hướng mặt. Hiện đây là mục tham khảo, chưa có mô hình luyện tập tương ứng.",
    ],
    "Phân biệt U/L/R/B với ký hiệu chóp viết thường u/l/r/b; không dùng ý nghĩa nước xoay của 3×3.",
    ["R", "U'", "u"],
    "12e",
    ["pyraminx", "pyram", "tam giac", "tu dien"],
  ),
  entry(
    "megaminx",
    "Megaminx",
    "dodecahedron",
    null,
    "advanced",
    "Puzzle mười hai mặt với các mặt ngũ giác.",
    [
      "Số mặt và hình dạng ngũ giác thay đổi cách định hướng và theo dõi các mảnh so với Rubik 3×3.",
      "Cần bố trí mặt, profile nhận màu và solver riêng. Khả năng của một thư viện không đồng nghĩa ShanBik đã cung cấp các chức năng này.",
    ],
    "Notation scramble Megaminx sử dụng cả U và các ký hiệu như R++/D--; hãy xem quy ước đầy đủ tại WCA.",
    ["R++", "D--", "U'"],
    "12d",
    ["megaminx", "minx", "muoi hai mat"],
  ),
  entry(
    "skewb",
    "Skewb",
    "cube",
    null,
    "beginner",
    "Hình lập phương nhưng cơ chế xoay quanh góc khác khối NxN.",
    [
      "Nhìn giống khối vuông không có nghĩa các ô và nước xoay tuân theo lưới NxN.",
      "ShanBik chưa có player hay cách nhập trạng thái Skewb. Bộ lọc lớp NxN không gán một số N cho mục này.",
    ],
    "Các chữ R/L/U/B theo quy ước Skewb; phải hiểu hướng giữ puzzle trước khi đọc chuỗi.",
    ["R", "L'", "U"],
    "12h",
    ["skewb", "xoay goc"],
  ),
  entry(
    "square-1",
    "Square-1",
    "shapeshifter",
    null,
    "advanced",
    "Puzzle có thể thay đổi hình dạng trong quá trình xoay.",
    [
      "Trạng thái solved có dạng khối vuông, nhưng các bước xoay có thể tạo hình dạng khác. Bố trí mảnh cần được theo dõi cùng màu.",
      "Nhập ảnh cần xử lý cả hình dạng và cách chia mảnh theo trạng thái. Pipeline ảnh hiện tại chưa cung cấp adapter Square-1.",
    ],
    "Cặp (x,y) mô tả hai tầng; dấu / chỉ nước slice. Grammar này chưa có trên player ShanBik.",
    ["(1,0)", "/", "(0,-1)"],
    "12c",
    ["square-1", "square1", "sq1", "doi hinh"],
  ),
]);
export const getPuzzle = (slug: string) =>
  PUZZLES.find((puzzle) => puzzle.slug === slug);
