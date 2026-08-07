export function NatalInterpretation({ text }: { text: string }) {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\s+(?=(?:#{1,3}\s*)?\d{1,2}\.\s+[A-Z])/g, "\n")
    .trim();
  const sections = normalized
    .split(/\n(?=(?:#{1,3}\s*)?\d{1,2}\.\s+)/)
    .filter(Boolean);

  return sections.map((section, index) => {
    const lines = section.trim().split("\n");
    const first = lines.shift() ?? "Chart interpretation";
    const heading = first
      .replace(/^#{1,3}\s*/, "")
      .replace(/^\d{1,2}\.\s*/, "");
    const body = lines.join("\n").trim();
    const paragraphs = (body || (sections.length === 1 ? normalized : ""))
      .split(/\n\s*\n+/)
      .map((paragraph) => paragraph.replace(/^#{1,3}\s*/, "").trim())
      .filter(Boolean);
    return (
      <section key={`${heading}-${index}`} className="interpretation-section">
        <p className="interpretation-section__index">
          {String(index + 1).padStart(2, "0")}
        </p>
        <div>
          <h2>{heading}</h2>
          {paragraphs.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex}>{paragraph}</p>
          ))}
        </div>
      </section>
    );
  });
}
