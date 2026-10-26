import Link from "next/link";

const upcoming = [
  {
    number: "01",
    title: "Khám phá khối 3×3",
    description: "Làm quen với các mặt, ký hiệu và thao tác xoay khối.",
  },
  {
    number: "02",
    title: "Quan sát từng nước đi",
    description: "Theo dõi từng bước để hiểu rõ khối Rubik của bạn.",
  },
  {
    number: "03",
    title: "Luyện tập theo nhịp riêng",
    description: "Từng bước hình thành thói quen và nâng cao kỹ năng.",
  },
];

export default function HomePage() {
  return (
    <div className="site-container">
      <section
        id="overview"
        aria-labelledby="intro-title"
        className="section-space content-width"
      >
        <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent">
          <span aria-hidden="true" className="size-2 rounded-full bg-current" />
          Đang xây dựng
        </p>
        <p className="mb-3 text-sm font-semibold tracking-widest text-primary uppercase">
          Chào mừng đến với ShanBik
        </p>
        <h1 id="intro-title" className="text-display text-foreground">
          Mỗi nước xoay,
          <br />
          <span className="text-primary">một bước tiến.</span>
        </h1>
        <p className="text-body-lg mt-6 max-w-xl text-muted">
          Không gian học, mô phỏng và luyện tập Rubik dành cho bạn.
        </p>
        <p className="text-body mt-4 max-w-xl text-muted">
          Chúng mình đang chuẩn bị những công cụ đầu tiên cho khối 3×3. Hẹn gặp
          bạn sớm!
        </p>
        <Link
          href="/practice"
          className="touch-control mt-8 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Khám phá khu vực luyện tập{" "}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </Link>
      </section>
      <section
        id="progress"
        aria-labelledby="progress-title"
        className="pb-16 sm:pb-24"
      >
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <h2 id="progress-title" className="text-heading">
            Bắt đầu từ sự tò mò.
          </h2>
          <p className="text-sm text-muted">
            Các trải nghiệm đang được chuẩn bị
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {upcoming.map((item) => (
            <li
              key={item.number}
              className="panel-shadow overflow-hidden rounded-panel border border-border bg-surface"
            >
              <div aria-hidden="true" className="brand-rule" />
              <div className="p-6 sm:p-8">
                <p
                  aria-hidden="true"
                  className="mb-6 font-mono text-sm font-semibold text-accent"
                >
                  / {item.number}
                </p>
                <h3 className="text-lg leading-snug font-bold">{item.title}</h3>
                <p className="text-body mt-3 text-muted">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section
        aria-labelledby="explore-title"
        className="mb-16 rounded-panel border border-border bg-surface p-6 sm:p-8"
      >
        <h2 id="explore-title" className="text-heading">
          Khám phá trước khi bắt đầu.
        </h2>
        <p className="text-body mt-3 text-muted">
          Một vài kiến thức nhập môn và câu trả lời cho những thắc mắc đầu tiên
          của bạn.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/learn" className="ui-button ui-button--secondary">
            Học cơ bản
          </Link>
          <Link href="/help" className="ui-button ui-button--ghost">
            Trợ giúp
          </Link>
        </div>
      </section>
    </div>
  );
}
