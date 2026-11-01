export function NatalChartActions({ downloadHref }: { downloadHref: string }) {
  return (
    <div className="natal-chart-actions" aria-label="Natal chart actions">
      <a className="atlas-button" href={downloadHref} download>
        <span aria-hidden="true">&#8595;</span>
        Download PDF
      </a>
    </div>
  );
}
