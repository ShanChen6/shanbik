export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section
        className="w-full max-w-2xl rounded-3xl border border-teal-200 bg-white p-8 shadow-sm sm:p-14"
        aria-labelledby="title"
      >
        <p className="mb-6 inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-900">
          Đang xây dựng
        </p>
        <h1
          id="title"
          className="text-5xl font-bold tracking-tight text-teal-900 sm:text-6xl"
        >
          ShanBik
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-700">
          Không gian học, mô phỏng và luyện tập Rubik dành cho bạn.
        </p>
        <p className="mt-4 leading-7 text-slate-600">
          Chúng mình đang chuẩn bị những công cụ đầu tiên cho khối 3×3. Hẹn gặp
          bạn sớm!
        </p>
      </section>
    </main>
  );
}
