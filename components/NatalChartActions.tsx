"use client";

export function NatalChartActions() {
  return (
    <div className="natal-chart-actions" aria-label="Natal chart actions">
      <button
        type="button"
        className="button-primary"
        onClick={() => window.print()}
      >
        <span aria-hidden="true">&#8595;</span>
        Print or save PDF
      </button>
    </div>
  );
}
