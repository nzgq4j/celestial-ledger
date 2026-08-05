import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.dirname(
  new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, "$1:"),
);
const outputPath = path.join(
  outputDir,
  "celestial-atlas-18-month-monetization-model.xlsx",
);

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Executive Summary");
const assumptions = workbook.worksheets.add("Assumptions");
const forecast = workbook.worksheets.add("Monthly Forecast");
const scenarios = workbook.worksheets.add("Scenario Analysis");
const checks = workbook.worksheets.add("Checks");
const sources = workbook.worksheets.add("Sources");

const colors = {
  ink: "#F4EBD8",
  muted: "#B8B2A5",
  navy: "#071321",
  panel: "#0E1D30",
  panel2: "#13253C",
  gold: "#C8A654",
  paleGold: "#F1E4B5",
  line: "#31445A",
  input: "#FFF2CC",
  inputText: "#0000FF",
  formulaText: "#000000",
  linkedText: "#008000",
  ok: "#C6E0B4",
  fail: "#F4CCCC",
  white: "#FFFFFF",
  black: "#000000",
};

function titleBand(sheet, title, subtitle, endCol = "J") {
  sheet.showGridLines = false;
  sheet.getRange(`A1:${endCol}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${endCol}1`).format = {
    fill: colors.navy,
    font: { bold: true, color: colors.ink, size: 20 },
    rowHeight: 34,
    verticalAlignment: "center",
  };
  sheet.getRange(`A2:${endCol}2`).merge();
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A2:${endCol}2`).format = {
    fill: colors.navy,
    font: { color: colors.muted, size: 10 },
    rowHeight: 28,
    wrapText: true,
    verticalAlignment: "center",
  };
}

function styleHeader(range) {
  range.format = {
    fill: colors.panel2,
    font: { bold: true, color: colors.ink },
    borders: { preset: "outside", style: "thin", color: colors.line },
    verticalAlignment: "center",
    wrapText: true,
  };
}

function styleSection(range) {
  range.format = {
    fill: colors.panel,
    font: { bold: true, color: colors.gold },
    borders: { bottom: { style: "thin", color: colors.gold } },
  };
}

function addSourceComment(cell, text) {
  workbook.comments.addThread({ cell }, text);
}

await workbook.comments.setSelf({ displayName: "David" });

// Assumptions
titleBand(
  assumptions,
  "Celestial Atlas — Monetization Assumptions",
  "Editable inputs are blue on pale gold. Base case is used in the monthly forecast; Conservative and Upside drive scenario analysis. USD, monthly model, August 2026 start.",
  "H",
);
assumptions.getRange("A4:H4").values = [
  [
    "Category",
    "Assumption",
    "Conservative",
    "Base",
    "Upside",
    "Unit",
    "Notes",
    "Source ID",
  ],
];
styleHeader(assumptions.getRange("A4:H4"));

const assumptionRows = [
  [
    "User base",
    "Starting active users",
    500,
    500,
    500,
    "users",
    "Starting cohort supplied by user",
    "USR-01",
  ],
  [
    "Tier mix",
    "Free share",
    0.85,
    0.8,
    0.7,
    "%",
    "Mix is held constant within each scenario",
    "ASM-01",
  ],
  [
    "Tier mix",
    "Personal share",
    0.12,
    0.16,
    0.23,
    "%",
    "$9.99 monthly tier",
    "ASM-01",
  ],
  [
    "Tier mix",
    "Premium share",
    0.03,
    0.04,
    0.07,
    "%",
    "$19.99 monthly tier",
    "ASM-01",
  ],
  [
    "Pricing",
    "Personal monthly price",
    9.99,
    9.99,
    9.99,
    "USD",
    "Monthly billing assumed; annual plans excluded",
    "ASM-02",
  ],
  [
    "Pricing",
    "Premium monthly price",
    19.99,
    19.99,
    19.99,
    "USD",
    "Monthly billing assumed; annual plans excluded",
    "ASM-02",
  ],
  [
    "Fixed cost",
    "Hosting / operations",
    250,
    250,
    250,
    "USD/month",
    "Half of $500 combined monthly operating and advertising budget",
    "USR-02",
  ],
  [
    "Fixed cost",
    "Advertising",
    250,
    250,
    250,
    "USD/month",
    "Half of $500 combined monthly operating and advertising budget",
    "USR-03",
  ],
  [
    "Growth",
    "Paid acquisition CAC",
    25,
    20,
    15,
    "USD/user",
    "Planning assumption; validate with campaign data",
    "ASM-03",
  ],
  [
    "Growth",
    "Organic additions",
    0.005,
    0.01,
    0.015,
    "% of opening users/month",
    "Planning assumption",
    "ASM-04",
  ],
  [
    "Growth",
    "Monthly churn",
    0.04,
    0.03,
    0.025,
    "% of opening users/month",
    "Blended cross-tier planning assumption",
    "ASM-05",
  ],
  [
    "Add-ons",
    "Daily-reading pack price",
    5,
    5,
    5,
    "USD",
    "One pack transaction; recommended 7 credits",
    "ASM-06",
  ],
  [
    "Add-ons",
    "Free pack purchase rate",
    0.08,
    0.08,
    0.08,
    "% users/month",
    "Planning assumption",
    "ASM-07",
  ],
  [
    "Add-ons",
    "Personal pack purchase rate",
    0.03,
    0.03,
    0.03,
    "% users/month",
    "Planning assumption",
    "ASM-07",
  ],
  [
    "Add-ons",
    "Premium pack purchase rate",
    0.01,
    0.01,
    0.01,
    "% users/month",
    "Planning assumption",
    "ASM-07",
  ],
  [
    "Reports",
    "Standard report list price",
    14.99,
    14.99,
    14.99,
    "USD",
    "Future Trends at $29.99 excluded from base forecast",
    "ASM-08",
  ],
  [
    "Reports",
    "Personal report discount",
    0.1,
    0.1,
    0.1,
    "%",
    "Applied to paid standard reports",
    "ASM-09",
  ],
  [
    "Reports",
    "Premium report discount",
    0.2,
    0.2,
    0.2,
    "%",
    "Applied to paid standard reports",
    "ASM-09",
  ],
  [
    "Reports",
    "Free report purchase rate",
    0.02,
    0.02,
    0.02,
    "% users/month",
    "Planning assumption",
    "ASM-10",
  ],
  [
    "Reports",
    "Personal report purchase rate",
    0.04,
    0.04,
    0.04,
    "% users/month",
    "Planning assumption",
    "ASM-10",
  ],
  [
    "Reports",
    "Premium report purchase rate",
    0.02,
    0.02,
    0.02,
    "% users/month",
    "Additional purchases beyond included credit",
    "ASM-10",
  ],
  [
    "Reports",
    "Premium included reports",
    1 / 3,
    1 / 3,
    1 / 3,
    "reports/user/month",
    "One standard report credit every three months",
    "ASM-11",
  ],
  [
    "AI pricing",
    "GPT-5 mini input price",
    0.25,
    0.25,
    0.25,
    "USD/1M tokens",
    "Official OpenAI price",
    "OAI-01",
  ],
  [
    "AI pricing",
    "GPT-5 mini output price",
    2,
    2,
    2,
    "USD/1M tokens",
    "Official OpenAI price",
    "OAI-01",
  ],
  [
    "AI usage",
    "Long-report input tokens",
    15000,
    15000,
    15000,
    "tokens/attempt",
    "Conservative planning allowance",
    "ASM-12",
  ],
  [
    "AI usage",
    "Long-report output tokens",
    20000,
    20000,
    20000,
    "tokens/attempt",
    "Conservative planning allowance",
    "ASM-12",
  ],
  [
    "AI usage",
    "Average report attempts",
    1.1,
    1.1,
    1.1,
    "attempts/report",
    "Allows 10% retry overhead",
    "ASM-13",
  ],
  [
    "AI usage",
    "Natal interpretation input tokens",
    5000,
    5000,
    5000,
    "tokens/chart",
    "Planning allowance",
    "ASM-14",
  ],
  [
    "AI usage",
    "Natal interpretation output tokens",
    2000,
    2000,
    2000,
    "tokens/chart",
    "Planning allowance",
    "ASM-14",
  ],
  [
    "AI usage",
    "Free initial charts per new user",
    1,
    1,
    1,
    "charts",
    "Entitlement design",
    "ASM-15",
  ],
  [
    "AI usage",
    "Personal initial charts per new user",
    1.4,
    1.4,
    1.4,
    "charts",
    "Average utilisation below two-chart ceiling",
    "ASM-15",
  ],
  [
    "AI usage",
    "Premium initial charts per new user",
    2,
    2,
    2,
    "charts",
    "Average utilisation below five-chart ceiling",
    "ASM-15",
  ],
  [
    "Payments",
    "Card processing rate",
    0.029,
    0.029,
    0.029,
    "% revenue",
    "US domestic online card assumption",
    "STR-01",
  ],
  [
    "Payments",
    "Fixed card fee",
    0.3,
    0.3,
    0.3,
    "USD/transaction",
    "US domestic online card assumption",
    "STR-01",
  ],
  [
    "Payments",
    "Stripe Billing fee",
    0.007,
    0.007,
    0.007,
    "% subscription volume",
    "Pay-as-you-go Billing assumption",
    "STR-01",
  ],
  [
    "Model",
    "Forecast months",
    18,
    18,
    18,
    "months",
    "August 2026 through January 2028",
    "USR-04",
  ],
];

assumptions.getRange(`A5:H${4 + assumptionRows.length}`).values =
  assumptionRows;
assumptions.getRange(`C5:E${4 + assumptionRows.length}`).format = {
  fill: colors.input,
  font: { color: colors.inputText },
};
assumptions.getRange("C6:E8").format.numberFormat = "0.0%";
assumptions.getRange("C14:E15").format.numberFormat = "0.0%";
assumptions.getRange("C17:E19").format.numberFormat = "0.0%";
assumptions.getRange("C21:E25").format.numberFormat = "0.0%";
assumptions.getRange("C37:E37").format.numberFormat = "0.0%";
assumptions.getRange("C39:E39").format.numberFormat = "0.0%";
assumptions.getRange("C9:E13").format.numberFormat = "$0.00";
assumptions.getRange("C16:E16").format.numberFormat = "$0.00";
assumptions.getRange("C20:E20").format.numberFormat = "$0.00";
assumptions.getRange("C26:E26").format.numberFormat = "0.00";
assumptions.getRange("C27:E28").format.numberFormat = "$0.00";
assumptions.getRange("C31:E36").format.numberFormat = "0.0";
assumptions.getRange("C38:E38").format.numberFormat = "$0.00";
assumptions.getRange("A5:H40").format.borders = {
  insideHorizontal: { style: "thin", color: "#E6E6E6" },
};
assumptions.freezePanes.freezeRows(4);
assumptions.getRange("A:A").format.columnWidth = 15;
assumptions.getRange("B:B").format.columnWidth = 31;
assumptions.getRange("C:E").format.columnWidth = 14;
assumptions.getRange("F:F").format.columnWidth = 22;
assumptions.getRange("G:G").format.columnWidth = 48;
assumptions.getRange("H:H").format.columnWidth = 12;
assumptions.getRange("A5:H40").format.wrapText = true;
addSourceComment(
  assumptions.getRange("D5"),
  "User input: 500 starting active users.",
);
addSourceComment(
  assumptions.getRange("D11"),
  "User input: operational and advertising expenses reduced to $500 total per month. Model assumption: $250 hosting/operations.",
);
addSourceComment(
  assumptions.getRange("D12"),
  "User input: operational and advertising expenses reduced to $500 total per month. Model assumption: $250 advertising.",
);
addSourceComment(
  assumptions.getRange("D27"),
  "Source: https://developers.openai.com/api/docs/models/gpt-5-mini | Accessed 2026-08-05 | $0.25 per 1M input tokens.",
);
addSourceComment(
  assumptions.getRange("D28"),
  "Source: https://developers.openai.com/api/docs/models/gpt-5-mini | Accessed 2026-08-05 | $2.00 per 1M output tokens.",
);
addSourceComment(
  assumptions.getRange("D37"),
  "Source: https://stripe.com/pricing | Accessed 2026-08-05 | 2.9% online domestic card fee assumption.",
);
addSourceComment(
  assumptions.getRange("D38"),
  "Source: https://stripe.com/pricing | Accessed 2026-08-05 | $0.30 fixed transaction fee assumption.",
);
addSourceComment(
  assumptions.getRange("D39"),
  "Source: https://stripe.com/pricing | Accessed 2026-08-05 | 0.7% Stripe Billing pay-as-you-go assumption.",
);

// Monthly base forecast
titleBand(
  forecast,
  "18-Month Base-Case Forecast",
  "Starts with 500 active users. Advertising acquires users at the base-case CAC; organic additions and churn are applied to opening users. Revenue uses average monthly active users.",
  "AB",
);
forecast.getRange("A4:AB4").values = [
  [
    "Month",
    "Opening users",
    "Paid adds",
    "Organic adds",
    "Churned",
    "Closing users",
    "Average active users",
    "Free",
    "Personal",
    "Premium",
    "Subscription revenue",
    "Pack revenue",
    "Report revenue",
    "Total revenue",
    "Paid reports",
    "Included reports",
    "Report AI cost",
    "Natal interpretations",
    "Natal AI cost",
    "Total AI cost",
    "Payment fees",
    "Hosting",
    "Advertising",
    "Total cost",
    "Operating contribution",
    "Contribution margin",
    "Cumulative contribution",
    "Revenue / active user",
  ],
];
styleHeader(forecast.getRange("A4:AB4"));
const monthLabels = [
  "Aug 2026",
  "Sep 2026",
  "Oct 2026",
  "Nov 2026",
  "Dec 2026",
  "Jan 2027",
  "Feb 2027",
  "Mar 2027",
  "Apr 2027",
  "May 2027",
  "Jun 2027",
  "Jul 2027",
  "Aug 2027",
  "Sep 2027",
  "Oct 2027",
  "Nov 2027",
  "Dec 2027",
  "Jan 2028",
];
const forecastDates = monthLabels.map((label) => [label]);
forecast.getRange("A5:A22").values = forecastDates;

for (let r = 5; r <= 22; r += 1) {
  forecast.getRange(`B${r}`).formulas = [
    [r === 5 ? "='Assumptions'!D5" : `=F${r - 1}`],
  ];
  forecast.getRange(`C${r}`).formulas = [
    ["='Assumptions'!D12/'Assumptions'!D13"],
  ];
  forecast.getRange(`D${r}`).formulas = [[`=B${r}*'Assumptions'!D14`]];
  forecast.getRange(`E${r}`).formulas = [[`=B${r}*'Assumptions'!D15`]];
  forecast.getRange(`F${r}`).formulas = [[`=B${r}+C${r}+D${r}-E${r}`]];
  forecast.getRange(`G${r}`).formulas = [[`=(B${r}+F${r})/2`]];
  forecast.getRange(`H${r}`).formulas = [[`=G${r}*'Assumptions'!D6`]];
  forecast.getRange(`I${r}`).formulas = [[`=G${r}*'Assumptions'!D7`]];
  forecast.getRange(`J${r}`).formulas = [[`=G${r}*'Assumptions'!D8`]];
  forecast.getRange(`K${r}`).formulas = [
    [`=I${r}*'Assumptions'!D9+J${r}*'Assumptions'!D10`],
  ];
  forecast.getRange(`L${r}`).formulas = [
    [
      `=(H${r}*'Assumptions'!D17+I${r}*'Assumptions'!D18+J${r}*'Assumptions'!D19)*'Assumptions'!D16`,
    ],
  ];
  forecast.getRange(`M${r}`).formulas = [
    [
      `=H${r}*'Assumptions'!D23*'Assumptions'!D20+I${r}*'Assumptions'!D24*'Assumptions'!D20*(1-'Assumptions'!D21)+J${r}*'Assumptions'!D25*'Assumptions'!D20*(1-'Assumptions'!D22)`,
    ],
  ];
  forecast.getRange(`N${r}`).formulas = [[`=SUM(K${r}:M${r})`]];
  forecast.getRange(`O${r}`).formulas = [
    [
      `=H${r}*'Assumptions'!D23+I${r}*'Assumptions'!D24+J${r}*'Assumptions'!D25`,
    ],
  ];
  forecast.getRange(`P${r}`).formulas = [[`=J${r}*'Assumptions'!D26`]];
  forecast.getRange(`Q${r}`).formulas = [
    [
      `=(O${r}+P${r})*(('Assumptions'!D29/1000000)*'Assumptions'!D27+('Assumptions'!D30/1000000)*'Assumptions'!D28)*'Assumptions'!D31`,
    ],
  ];
  forecast.getRange(`R${r}`).formulas = [
    [
      `=(C${r}+D${r})*('Assumptions'!D6*'Assumptions'!D34+'Assumptions'!D7*'Assumptions'!D35+'Assumptions'!D8*'Assumptions'!D36)`,
    ],
  ];
  forecast.getRange(`S${r}`).formulas = [
    [
      `=R${r}*(('Assumptions'!D32/1000000)*'Assumptions'!D27+('Assumptions'!D33/1000000)*'Assumptions'!D28)`,
    ],
  ];
  forecast.getRange(`T${r}`).formulas = [[`=SUM(Q${r},S${r})`]];
  forecast.getRange(`U${r}`).formulas = [
    [
      `=K${r}*('Assumptions'!D37+'Assumptions'!D39)+(I${r}+J${r})*'Assumptions'!D38+L${r}*'Assumptions'!D37+(H${r}*'Assumptions'!D17+I${r}*'Assumptions'!D18+J${r}*'Assumptions'!D19)*'Assumptions'!D38+M${r}*'Assumptions'!D37+O${r}*'Assumptions'!D38`,
    ],
  ];
  forecast.getRange(`V${r}`).formulas = [["='Assumptions'!D11"]];
  forecast.getRange(`W${r}`).formulas = [["='Assumptions'!D12"]];
  forecast.getRange(`X${r}`).formulas = [[`=SUM(T${r}:W${r})`]];
  forecast.getRange(`Y${r}`).formulas = [[`=N${r}-X${r}`]];
  forecast.getRange(`Z${r}`).formulas = [[`=IF(N${r}=0,0,Y${r}/N${r})`]];
  forecast.getRange(`AA${r}`).formulas = [
    [r === 5 ? `=Y${r}` : `=AA${r - 1}+Y${r}`],
  ];
  forecast.getRange(`AB${r}`).formulas = [[`=IF(G${r}=0,0,N${r}/G${r})`]];
}

forecast.getRange("B5:J22").format.numberFormat = "#,##0.0";
forecast.getRange("K5:N22").format.numberFormat =
  "$#,##0.00;[Red]($#,##0.00);-";
forecast.getRange("O5:P22").format.numberFormat = "#,##0.0";
forecast.getRange("Q5:Q22").format.numberFormat = "$0.00";
forecast.getRange("R5:R22").format.numberFormat = "#,##0.0";
forecast.getRange("S5:Y22").format.numberFormat =
  "$#,##0.00;[Red]($#,##0.00);-";
forecast.getRange("Z5:Z22").format.numberFormat = "0.0%";
forecast.getRange("AA5:AB22").format.numberFormat =
  "$#,##0.00;[Red]($#,##0.00);-";
forecast.getRange("A5:AB22").format.borders = {
  insideHorizontal: { style: "thin", color: "#E6E6E6" },
};
forecast.freezePanes.freezeRows(4);
forecast.freezePanes.freezeColumns(1);
forecast.getRange("A:A").format.columnWidth = 12;
forecast.getRange("B:J").format.columnWidth = 14;
forecast.getRange("K:AB").format.columnWidth = 16;

// Scenario analysis
titleBand(
  scenarios,
  "Scenario Analysis",
  "Conservative, Base, and Upside cases vary tier mix, paid CAC, organic additions, and churn. Prices, purchase rates, model usage, and fixed costs remain unchanged so the sensitivity is easy to audit.",
  "J",
);
scenarios.getRange("A4:J4").values = [
  [
    "Scenario",
    "Tier mix (Free / Personal / Premium)",
    "Month 18 closing users",
    "18M revenue",
    "18M AI cost",
    "18M payment fees",
    "18M fixed costs",
    "18M contribution",
    "18M margin",
    "Month 18 contribution",
  ],
];
styleHeader(scenarios.getRange("A4:J4"));
scenarios.getRange("A5:A7").values = [["Conservative"], ["Base"], ["Upside"]];
scenarios.getRange("B5:B7").values = [
  ["85% / 12% / 3%"],
  ["80% / 16% / 4%"],
  ["70% / 23% / 7%"],
];

const scenarioCols = [
  {
    name: "Conservative",
    start: "A",
    end: "M",
    assumptionCol: "C",
    startIndex: 0,
  },
  { name: "Base", start: "O", end: "AA", assumptionCol: "D", startIndex: 14 },
  {
    name: "Upside",
    start: "AC",
    end: "AO",
    assumptionCol: "E",
    startIndex: 28,
  },
];
const scenarioHeaders = [
  "Month",
  "Opening",
  "Paid adds",
  "Organic adds",
  "Churned",
  "Closing",
  "Average active",
  "Revenue",
  "Paid reports",
  "AI cost",
  "Payment fees",
  "Total cost",
  "Contribution",
];

for (const block of scenarioCols) {
  const headerRange = scenarios.getRangeByIndexes(9, block.startIndex, 1, 13);
  headerRange.values = [scenarioHeaders];
  styleHeader(headerRange);
  const titleRange = scenarios.getRangeByIndexes(8, block.startIndex, 1, 13);
  titleRange.merge();
  titleRange.values = [[`${block.name} monthly detail`]];
  styleSection(titleRange);
  for (let i = 0; i < 18; i += 1) {
    const r = 11 + i;
    const a = block.startIndex;
    scenarios.getCell(r - 1, a).values = [[monthLabels[i]]];
    const cell = (offset) => scenarios.getCell(r - 1, a + offset);
    const letter = (offset) => {
      let n = a + offset + 1;
      let s = "";
      while (n > 0) {
        const rem = (n - 1) % 26;
        s = String.fromCharCode(65 + rem) + s;
        n = Math.floor((n - 1) / 26);
      }
      return s;
    };
    cell(1).formulas = [
      [
        i === 0
          ? `='Assumptions'!${block.assumptionCol}5`
          : `=${letter(5)}${r - 1}`,
      ],
    ];
    cell(2).formulas = [
      [
        `='Assumptions'!${block.assumptionCol}12/'Assumptions'!${block.assumptionCol}13`,
      ],
    ];
    cell(3).formulas = [
      [`=${letter(1)}${r}*'Assumptions'!${block.assumptionCol}14`],
    ];
    cell(4).formulas = [
      [`=${letter(1)}${r}*'Assumptions'!${block.assumptionCol}15`],
    ];
    cell(5).formulas = [
      [`=${letter(1)}${r}+${letter(2)}${r}+${letter(3)}${r}-${letter(4)}${r}`],
    ];
    cell(6).formulas = [[`=(${letter(1)}${r}+${letter(5)}${r})/2`]];
    cell(7).formulas = [
      [
        `=${letter(6)}${r}*('Assumptions'!${block.assumptionCol}7*'Assumptions'!${block.assumptionCol}9+'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}10)+(${letter(6)}${r}*'Assumptions'!${block.assumptionCol}6*'Assumptions'!${block.assumptionCol}17+${letter(6)}${r}*'Assumptions'!${block.assumptionCol}7*'Assumptions'!${block.assumptionCol}18+${letter(6)}${r}*'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}19)*'Assumptions'!${block.assumptionCol}16+${letter(6)}${r}*'Assumptions'!${block.assumptionCol}6*'Assumptions'!${block.assumptionCol}23*'Assumptions'!${block.assumptionCol}20+${letter(6)}${r}*'Assumptions'!${block.assumptionCol}7*'Assumptions'!${block.assumptionCol}24*'Assumptions'!${block.assumptionCol}20*(1-'Assumptions'!${block.assumptionCol}21)+${letter(6)}${r}*'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}25*'Assumptions'!${block.assumptionCol}20*(1-'Assumptions'!${block.assumptionCol}22)`,
      ],
    ];
    cell(8).formulas = [
      [
        `=${letter(6)}${r}*('Assumptions'!${block.assumptionCol}6*'Assumptions'!${block.assumptionCol}23+'Assumptions'!${block.assumptionCol}7*'Assumptions'!${block.assumptionCol}24+'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}25)`,
      ],
    ];
    cell(9).formulas = [
      [
        `=(${letter(8)}${r}+${letter(6)}${r}*'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}26)*(('Assumptions'!${block.assumptionCol}29/1000000)*'Assumptions'!${block.assumptionCol}27+('Assumptions'!${block.assumptionCol}30/1000000)*'Assumptions'!${block.assumptionCol}28)*'Assumptions'!${block.assumptionCol}31+(${letter(2)}${r}+${letter(3)}${r})*('Assumptions'!${block.assumptionCol}6*'Assumptions'!${block.assumptionCol}34+'Assumptions'!${block.assumptionCol}7*'Assumptions'!${block.assumptionCol}35+'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}36)*(('Assumptions'!${block.assumptionCol}32/1000000)*'Assumptions'!${block.assumptionCol}27+('Assumptions'!${block.assumptionCol}33/1000000)*'Assumptions'!${block.assumptionCol}28)`,
      ],
    ];
    cell(10).formulas = [
      [
        `=(${letter(6)}${r}*('Assumptions'!${block.assumptionCol}7*'Assumptions'!${block.assumptionCol}9+'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}10))*('Assumptions'!${block.assumptionCol}37+'Assumptions'!${block.assumptionCol}39)+${letter(6)}${r}*('Assumptions'!${block.assumptionCol}7+'Assumptions'!${block.assumptionCol}8)*'Assumptions'!${block.assumptionCol}38+((${letter(6)}${r}*'Assumptions'!${block.assumptionCol}6*'Assumptions'!${block.assumptionCol}17+${letter(6)}${r}*'Assumptions'!${block.assumptionCol}7*'Assumptions'!${block.assumptionCol}18+${letter(6)}${r}*'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}19)*'Assumptions'!${block.assumptionCol}16)*'Assumptions'!${block.assumptionCol}37+${letter(6)}${r}*('Assumptions'!${block.assumptionCol}6*'Assumptions'!${block.assumptionCol}17+'Assumptions'!${block.assumptionCol}7*'Assumptions'!${block.assumptionCol}18+'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}19)*'Assumptions'!${block.assumptionCol}38+(${letter(7)}${r}-${letter(6)}${r}*('Assumptions'!${block.assumptionCol}7*'Assumptions'!${block.assumptionCol}9+'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}10)-(${letter(6)}${r}*'Assumptions'!${block.assumptionCol}6*'Assumptions'!${block.assumptionCol}17+${letter(6)}${r}*'Assumptions'!${block.assumptionCol}7*'Assumptions'!${block.assumptionCol}18+${letter(6)}${r}*'Assumptions'!${block.assumptionCol}8*'Assumptions'!${block.assumptionCol}19)*'Assumptions'!${block.assumptionCol}16)*'Assumptions'!${block.assumptionCol}37+${letter(8)}${r}*'Assumptions'!${block.assumptionCol}38`,
      ],
    ];
    cell(11).formulas = [
      [
        `=${letter(9)}${r}+${letter(10)}${r}+'Assumptions'!${block.assumptionCol}11+'Assumptions'!${block.assumptionCol}12`,
      ],
    ];
    cell(12).formulas = [[`=${letter(7)}${r}-${letter(11)}${r}`]];
  }
  const blockRange = scenarios.getRangeByIndexes(10, block.startIndex, 18, 13);
  blockRange.format.borders = {
    insideHorizontal: { style: "thin", color: "#E6E6E6" },
  };
  scenarios.getRangeByIndexes(
    10,
    block.startIndex + 1,
    18,
    6,
  ).format.numberFormat = "#,##0.0";
  scenarios.getRangeByIndexes(
    10,
    block.startIndex + 7,
    18,
    1,
  ).format.numberFormat = "$#,##0.00";
  scenarios.getRangeByIndexes(
    10,
    block.startIndex + 8,
    18,
    1,
  ).format.numberFormat = "#,##0.0";
  scenarios.getRangeByIndexes(
    10,
    block.startIndex + 9,
    18,
    4,
  ).format.numberFormat = "$#,##0.00;[Red]($#,##0.00);-";
}

for (let i = 0; i < 3; i += 1) {
  const row = 5 + i;
  const block = scenarioCols[i];
  const a = block.startIndex;
  const letter = (offset) => {
    let n = a + offset + 1;
    let s = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };
  scenarios.getRange(`C${row}`).formulas = [[`=${letter(5)}28`]];
  scenarios.getRange(`D${row}`).formulas = [
    [`=SUM(${letter(7)}11:${letter(7)}28)`],
  ];
  scenarios.getRange(`E${row}`).formulas = [
    [`=SUM(${letter(9)}11:${letter(9)}28)`],
  ];
  scenarios.getRange(`F${row}`).formulas = [
    [`=SUM(${letter(10)}11:${letter(10)}28)`],
  ];
  scenarios.getRange(`G${row}`).formulas = [
    [
      `=('Assumptions'!${block.assumptionCol}11+'Assumptions'!${block.assumptionCol}12)*'Assumptions'!${block.assumptionCol}40`,
    ],
  ];
  scenarios.getRange(`H${row}`).formulas = [
    [`=SUM(${letter(12)}11:${letter(12)}28)`],
  ];
  scenarios.getRange(`I${row}`).formulas = [
    [`=IF(D${row}=0,0,H${row}/D${row})`],
  ];
  scenarios.getRange(`J${row}`).formulas = [[`=${letter(12)}28`]];
}
scenarios.getRange("C5:C7").format.numberFormat = "#,##0";
scenarios.getRange("D5:H7").format.numberFormat = "$#,##0;[Red]($#,##0);-";
scenarios.getRange("I5:I7").format.numberFormat = "0.0%";
scenarios.getRange("J5:J7").format.numberFormat = "$#,##0;[Red]($#,##0);-";
scenarios.getRange("A5:J7").format.borders = {
  insideHorizontal: { style: "thin", color: "#E6E6E6" },
  bottom: { style: "thin", color: colors.line },
};
scenarios.getRange("A:A").format.columnWidth = 15;
scenarios.getRange("B:B").format.columnWidth = 31;
scenarios.getRange("C:J").format.columnWidth = 17;
scenarios.freezePanes.freezeRows(4);

// Checks
titleBand(
  checks,
  "Model Checks",
  "PASS means the core inputs, tier mix, roll-forward, revenue bridge, cost bridge, and scenario summaries reconcile within the stated tolerance.",
  "G",
);
checks.getRange("A4:G4").values = [
  [
    "Check",
    "Actual",
    "Expected",
    "Difference",
    "Tolerance",
    "Status",
    "Where to fix / notes",
  ],
];
styleHeader(checks.getRange("A4:G4"));
checks.getRange("A5:A13").values = [
  ["Base tier mix sums to 100%"],
  ["Conservative tier mix sums to 100%"],
  ["Upside tier mix sums to 100%"],
  ["Month 1 opening users match input"],
  ["Month 18 cumulative contribution ties"],
  ["Monthly revenue components tie"],
  ["Monthly cost components tie"],
  ["Scenario base revenue ties to forecast"],
  ["AI costs are non-negative"],
];
checks.getRange("B5:B13").formulas = [
  ["=SUM('Assumptions'!D6:D8)"],
  ["=SUM('Assumptions'!C6:C8)"],
  ["=SUM('Assumptions'!E6:E8)"],
  ["='Monthly Forecast'!B5"],
  ["='Monthly Forecast'!AA22"],
  ["=SUM('Monthly Forecast'!N5:N22)"],
  ["=SUM('Monthly Forecast'!X5:X22)"],
  ["='Scenario Analysis'!D6"],
  ["=MIN('Monthly Forecast'!T5:T22)"],
];
checks.getRange("C5:C13").formulas = [
  ["=1"],
  ["=1"],
  ["=1"],
  ["='Assumptions'!D5"],
  ["=SUM('Monthly Forecast'!Y5:Y22)"],
  ["=SUM('Monthly Forecast'!K5:M22)"],
  ["=SUM('Monthly Forecast'!T5:W22)"],
  ["=SUM('Monthly Forecast'!N5:N22)"],
  ["=MAX(0,B13)"],
];
checks.getRange("D5:D13").formulas = Array.from({ length: 9 }, (_, i) => [
  `=B${5 + i}-C${5 + i}`,
]);
checks.getRange("E5:E13").values = [
  [0.000001],
  [0.000001],
  [0.000001],
  [0.000001],
  [0.01],
  [0.01],
  [0.01],
  [0.01],
  [0.000001],
];
checks.getRange("F5:F13").formulas = Array.from({ length: 9 }, (_, i) => [
  `=IF(ABS(D${5 + i})<=E${5 + i},"OK","FAIL")`,
]);
checks.getRange("G5:G13").values = [
  ["Assumptions D6:D8"],
  ["Assumptions C6:C8"],
  ["Assumptions E6:E8"],
  ["Monthly Forecast B5"],
  ["Monthly Forecast AA22 / Y5:Y22"],
  ["Monthly Forecast K:M / N"],
  ["Monthly Forecast T:W / X"],
  ["Scenario Analysis Base vs Monthly Forecast"],
  ["Monthly Forecast T5:T22"],
];
checks.getRange("A15:C15").merge();
checks.getRange("A15").values = [["MODEL STATUS"]];
styleSection(checks.getRange("A15:C15"));
checks.getRange("D15:F15").merge();
checks.getRange("D15").formulas = [
  ['=IF(COUNTIF(F5:F13,"FAIL")=0,"PASS","FAIL")'],
];
checks.getRange("D15:F15").format = {
  font: { bold: true, size: 16 },
  horizontalAlignment: "center",
};
checks.getRange("F5:F13").conditionalFormats.add("containsText", {
  text: "OK",
  format: { fill: colors.ok, font: { bold: true } },
});
checks.getRange("F5:F13").conditionalFormats.add("containsText", {
  text: "FAIL",
  format: { fill: colors.fail, font: { bold: true } },
});
checks.getRange("D15:F15").conditionalFormats.add("containsText", {
  text: "PASS",
  format: { fill: colors.ok, font: { bold: true } },
});
checks.getRange("D15:F15").conditionalFormats.add("containsText", {
  text: "FAIL",
  format: { fill: colors.fail, font: { bold: true } },
});
checks.getRange("B5:E13").format.numberFormat = "0.0000";
checks.getRange("A:A").format.columnWidth = 36;
checks.getRange("B:F").format.columnWidth = 16;
checks.getRange("G:G").format.columnWidth = 44;

// Sources and methodology
titleBand(
  sources,
  "Sources and Methodology",
  "External prices are current as of August 5, 2026. Planning assumptions are deliberately separated from externally sourced unit prices.",
  "H",
);
sources.getRange("A4:H4").values = [
  [
    "Source ID",
    "Input / evidence",
    "Value",
    "Unit",
    "As of",
    "Source type",
    "Source / reference",
    "Notes",
  ],
];
styleHeader(sources.getRange("A4:H4"));
sources.getRange("A5:H12").values = [
  [
    "USR-01",
    "Starting active users",
    500,
    "users",
    "2026-08-05",
    "User input",
    "User request",
    "Starting cohort",
  ],
  [
    "USR-02",
    "Hosting / operations",
    250,
    "USD/month",
    "2026-08-05",
    "User input",
    "User request",
    "Half of $500 combined monthly budget",
  ],
  [
    "USR-03",
    "Advertising",
    250,
    "USD/month",
    "2026-08-05",
    "User input",
    "User request",
    "Half of $500 combined monthly budget",
  ],
  [
    "OAI-01",
    "GPT-5 mini token prices",
    "$0.25 input / $2.00 output",
    "USD/1M tokens",
    "2026-08-05",
    "Official pricing",
    "https://developers.openai.com/api/docs/models/gpt-5-mini",
    "Current model configured for private reports",
  ],
  [
    "STR-01",
    "Stripe standard US online card + Billing",
    "2.9% + $0.30; Billing 0.7%",
    "per transaction / billing volume",
    "2026-08-05",
    "Official pricing",
    "https://stripe.com/pricing",
    "Domestic-card planning assumption; international and FX fees excluded",
  ],
  [
    "CODE-01",
    "Daily reading model cost",
    0,
    "USD/reading",
    "2026-08-05",
    "Repository inspection",
    "lib/daily-readings",
    "Current daily readings are deterministic/template-based and cached; no OpenAI call",
  ],
  [
    "CODE-02",
    "Private report model",
    "gpt-5-mini",
    "model",
    "2026-08-05",
    "Repository inspection",
    "app/api/internal/report-worker/route.ts",
    "Worker allows up to two attempts; model assumes 1.10 average attempts",
  ],
  [
    "ASM-ALL",
    "Commercial and usage assumptions",
    "See Assumptions",
    "various",
    "2026-08-05",
    "Planning assumptions",
    "Assumptions sheet",
    "Must be validated with real conversion, churn, pack, and report purchase data",
  ],
];
sources.getRange("A14:H14").merge();
sources.getRange("A14").values = [["Scope exclusions"]];
styleSection(sources.getRange("A14:H14"));
sources.getRange("A15:H19").merge(true);
sources.getRange("A15:A19").values = [
  [
    "Founder or staff compensation, customer support, legal/accounting, taxes, refunds/chargebacks, email delivery, monitoring, storage overages, international-card/FX fees, app-store commissions, and annual-plan cash timing are excluded.",
  ],
  [
    "The forecast is an operating contribution model, not GAAP net income or cash flow.",
  ],
  [
    "Paid reports remain subject to Celestial Atlas release gates and legal/licensing approvals; this workbook is planning analysis only.",
  ],
  [
    "The 500-user base is assumed to exist at the start, so historical natal-chart generation cost is treated as sunk. New-user natal interpretations are included.",
  ],
  [
    "Future Trends report revenue is excluded, making the report-sales forecast conservative relative to the proposed catalog.",
  ],
];
sources.getRange("A15:H19").format.wrapText = true;
sources.getRange("A15:H19").format.rowHeight = 32;
sources.getRange("A:A").format.columnWidth = 13;
sources.getRange("B:B").format.columnWidth = 31;
sources.getRange("C:C").format.columnWidth = 26;
sources.getRange("D:F").format.columnWidth = 20;
sources.getRange("G:G").format.columnWidth = 58;
sources.getRange("H:H").format.columnWidth = 48;
sources.getRange("A5:H12").format.wrapText = true;

// Executive summary built from model outputs
titleBand(
  summary,
  "Celestial Atlas 18-Month Monetization Forecast",
  "Base case: 500 starting active users, 80% Free / 16% Personal / 4% Premium, and $500 total monthly fixed spend split $250 hosting/operations and $250 advertising. USD; operating contribution before labour, taxes, refunds, and other excluded overhead.",
  "L",
);
summary.getRange("A4:L4").merge();
summary.getRange("A4").values = [["EXECUTIVE SUMMARY"]];
styleSection(summary.getRange("A4:L4"));
summary.getRange("A5:L7").merge(true);
summary.getRange("A5:A7").values = [
  [
    "• The base case is contribution-positive from Month 1 because the proposed paid mix produces about $3.08 of monthly revenue per active user against approximately $0.19 of payment fees and only fractions of a cent of AI cost.",
  ],
  [
    "• Over 18 months, gross revenue reaches about $28.8k and operating contribution about $18.0k after $4.5k hosting/operations, $4.5k advertising, payment fees, and model costs.",
  ],
  [
    "• AI spend is not the economic constraint. The forecast produces roughly $18 of total AI cost; hosting/operations and advertising are the two largest cost lines at $4.5k each.",
  ],
];
summary.getRange("A5:L7").format = {
  wrapText: true,
  rowHeight: 34,
  font: { size: 11 },
};

const kpis = [
  ["A9:C9", "A10:C12", "Starting users", "='Assumptions'!D5", "#,##0"],
  ["D9:F9", "D10:F12", "Month 18 users", "='Monthly Forecast'!F22", "#,##0"],
  [
    "G9:I9",
    "G10:I12",
    "18M revenue",
    "=SUM('Monthly Forecast'!N5:N22)",
    "$#,##0",
  ],
  [
    "J9:L9",
    "J10:L12",
    "18M contribution",
    "=SUM('Monthly Forecast'!Y5:Y22)",
    "$#,##0",
  ],
  [
    "A14:C14",
    "A15:C17",
    "Month 1 contribution",
    "='Monthly Forecast'!Y5",
    "$#,##0",
  ],
  [
    "D14:F14",
    "D15:F17",
    "Month 18 contribution",
    "='Monthly Forecast'!Y22",
    "$#,##0",
  ],
  [
    "G14:I14",
    "G15:I17",
    "18M AI cost",
    "=SUM('Monthly Forecast'!T5:T22)",
    "$0.00",
  ],
  [
    "J14:L14",
    "J15:L17",
    "Break-even active users",
    "=('Assumptions'!D11+'Assumptions'!D12)/(('Monthly Forecast'!N5-'Monthly Forecast'!U5-'Monthly Forecast'!T5)/'Monthly Forecast'!G5)",
    "#,##0",
  ],
];
for (const [labelRange, valueRange, label, formula, format] of kpis) {
  summary.getRange(labelRange).merge();
  summary.getRange(labelRange.split(":")[0]).values = [[label]];
  summary.getRange(labelRange).format = {
    fill: colors.panel2,
    font: { bold: true, color: colors.gold },
    horizontalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.line },
  };
  summary.getRange(valueRange).merge();
  summary.getRange(valueRange.split(":")[0]).formulas = [[formula]];
  summary.getRange(valueRange).format = {
    fill: colors.panel,
    font: { bold: true, color: colors.ink, size: 18 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.line },
    numberFormat: format,
  };
}

summary.getRange("A20:F20").merge();
summary.getRange("A20").values = [["18-month cost composition"]];
styleSection(summary.getRange("A20:F20"));
summary.getRange("A21:B21").values = [["Cost", "18M total"]];
styleHeader(summary.getRange("A21:B21"));
summary.getRange("A22:A25").values = [
  ["Ops / hosting"],
  ["Advertising"],
  ["Payment fees"],
  ["AI model cost"],
];
summary.getRange("B22:B25").formulas = [
  ["=SUM('Monthly Forecast'!V5:V22)"],
  ["=SUM('Monthly Forecast'!W5:W22)"],
  ["=SUM('Monthly Forecast'!U5:U22)"],
  ["=SUM('Monthly Forecast'!T5:T22)"],
];
summary.getRange("B22:B25").format.numberFormat = "$#,##0.00";
summary.getRange("A21:B25").format.borders = {
  preset: "outside",
  style: "thin",
  color: colors.line,
};

summary.getRange("A43:L43").merge();
summary.getRange("A43").values = [["Recommended decisions"]];
styleSection(summary.getRange("A43:L43"));
summary.getRange("A44:L48").merge(true);
summary.getRange("A44:A48").values = [
  [
    "1. Keep the base prices at $9.99 Personal and $19.99 Premium for launch; the model does not need a price increase to cover AI.",
  ],
  [
    "2. Treat paid conversion and retention as the critical gates. A 20% paid mix is the base assumption; the Conservative case uses 15%.",
  ],
  [
    "3. Keep the $5 add-on as a multi-reading credit pack. The $0.30 fixed payment fee makes frequent tiny transactions inefficient.",
  ],
  [
    "4. Instrument CAC, 30/60/90-day retention, tier migration, pack attach rate, report attach rate, and retry/token usage before revising entitlements.",
  ],
  [
    "5. Do not treat this contribution forecast as authorization to enable paid reports; complete the existing legal, licensing, security, and operational release gates first.",
  ],
];
summary.getRange("A44:L48").format = {
  wrapText: true,
  rowHeight: 30,
  font: { size: 11 },
};

const trend = summary.charts.add("line", {
  chartType: "line",
  title: "Monthly revenue and total operating cost",
  hasLegend: true,
});
const revenueSeries = trend.series.add("Revenue");
revenueSeries.categoryFormula = "'Monthly Forecast'!$A$5:$A$22";
revenueSeries.formula = "'Monthly Forecast'!$N$5:$N$22";
revenueSeries.fill = colors.gold;
const costSeries = trend.series.add("Total cost");
costSeries.categoryFormula = "'Monthly Forecast'!$A$5:$A$22";
costSeries.formula = "'Monthly Forecast'!$X$5:$X$22";
costSeries.fill = "#6E88A8";
trend.title = "Monthly revenue and total operating cost";
trend.xAxis = { axisType: "textAxis", textStyle: { fontSize: 9 } };
trend.yAxis = { numberFormatCode: "$#,##0" };
trend.setPosition("D20", "L41");

const costChart = summary.charts.add("bar", summary.getRange("A21:B25"));
costChart.title = "18-month cost composition (USD)";
costChart.hasLegend = false;
costChart.yAxis = { numberFormatCode: "$#,##0" };
costChart.setPosition("A27", "C41");

summary.getRange("A:A").format.columnWidth = 18;
summary.getRange("B:L").format.columnWidth = 12;
summary.freezePanes.freezeRows(2);

// Apply common body typography and linked-formula colour convention.
for (const sheet of [assumptions, forecast, scenarios, checks, sources]) {
  const used = sheet.getUsedRange();
  if (used) used.format.font = { name: "Aptos", size: 10 };
}
summary.getUsedRange().format.font = { name: "Aptos", size: 10 };
forecast.getRange("B5:AB22").format.font = { color: colors.linkedText };
scenarios.getRange("C5:J7").format.font = { color: colors.linkedText };
checks.getRange("B5:F13").format.font = { color: colors.linkedText };

// Compact verification output.
const summaryInspect = await workbook.inspect({
  kind: "table",
  range: "Executive Summary!A1:L25",
  include: "values,formulas",
  tableMaxRows: 25,
  tableMaxCols: 12,
});
console.log(summaryInspect.ndjson);
const checkInspect = await workbook.inspect({
  kind: "table",
  range: "Checks!A4:G15",
  include: "values,formulas",
  tableMaxRows: 15,
  tableMaxCols: 7,
});
console.log(checkInspect.ndjson);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await fs.mkdir(path.join(outputDir, "previews"), { recursive: true });
for (const sheet of [
  summary,
  assumptions,
  forecast,
  scenarios,
  checks,
  sources,
]) {
  const preview = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    path.join(
      outputDir,
      "previews",
      `${sheet.name.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}.png`,
    ),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);
console.log(JSON.stringify({ outputPath }));
