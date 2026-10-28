export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="section-space max-w-content">
      <p className="mb-3 text-sm font-semibold tracking-widest text-primary uppercase">
        {eyebrow}
      </p>
      <h1 className="text-display">{title}</h1>
      <p className="text-body-lg mt-6 text-muted">{description}</p>
    </header>
  );
}
