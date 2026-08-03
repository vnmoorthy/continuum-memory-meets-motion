const PptxGenJS = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "..", "slides");
fs.mkdirSync(outDir, { recursive: true });

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "vnmoorthy";
pptx.title = "Continuum — Open Loop OS";
pptx.subject = "Memory Meets Motion · 3-minute pitch";

const BG = "07090C";
const INK = "ECE6DA";
const MUTED = "9AA3B0";
const ACCENT = "E4FF5C";
const MEMORY = "5EC8C0";
const MOTION = "E8956C";
const SOFT = "0E1218";

function wash(slide) {
  slide.background = { color: BG };
  slide.addShape(pptx.shapes.OVAL, {
    x: -1.8,
    y: -2.2,
    w: 6.5,
    h: 5.2,
    fill: { color: "0A2A28", transparency: 55 },
  });
  slide.addShape(pptx.shapes.OVAL, {
    x: 9.2,
    y: 4.0,
    w: 5.8,
    h: 4.8,
    fill: { color: "2A1A12", transparency: 48 },
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.07,
    fill: { color: ACCENT },
  });
}

function footer(slide, n) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.65,
    y: 6.95,
    w: 12.0,
    h: 0.01,
    fill: { color: "222831" },
  });
  slide.addText("CONTINUUM  ·  OPEN LOOP OS  ·  MEMORY MEETS MOTION", {
    x: 0.65,
    y: 7.05,
    w: 10,
    h: 0.28,
    fontSize: 9,
    color: MUTED,
    fontFace: "Calibri",
    charSpacing: 3,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: 11.7,
    y: 7.05,
    w: 0.9,
    h: 0.28,
    fontSize: 11,
    color: ACCENT,
    align: "right",
    fontFace: "Calibri",
  });
}

function kicker(slide, text, color = ACCENT) {
  slide.addText(text, {
    x: 0.7,
    y: 0.42,
    w: 12,
    h: 0.35,
    fontSize: 12,
    color,
    fontFace: "Calibri",
    bold: true,
    charSpacing: 4,
  });
}

// 1 — Cold open / brand
{
  const s = pptx.addSlide();
  wash(s);
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 1.45,
    w: 0.12,
    h: 3.6,
    fill: { color: ACCENT },
  });
  s.addText("CONTINUUM", {
    x: 1.15,
    y: 1.55,
    w: 11.2,
    h: 1.1,
    fontSize: 64,
    color: INK,
    fontFace: "Georgia",
  });
  s.addText("The Open Loop OS", {
    x: 1.15,
    y: 2.75,
    w: 11,
    h: 0.55,
    fontSize: 28,
    color: ACCENT,
    fontFace: "Georgia",
  });
  s.addText(
    "There’s a $220k renewal sitting in someone’s notes.\nContinuum doesn’t summarize it.\nIt finishes it.",
    {
      x: 1.15,
      y: 3.55,
      w: 10.5,
      h: 1.35,
      fontSize: 18,
      color: MUTED,
      fontFace: "Calibri",
    },
  );
  s.addText("Memory Meets Motion  ·  3 minutes", {
    x: 1.15,
    y: 5.2,
    w: 10,
    h: 0.35,
    fontSize: 12,
    color: MEMORY,
    fontFace: "Calibri",
    charSpacing: 2,
  });
  footer(s, 1);
}

// 2 — The feeling / problem
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "YOU ALREADY KNOW THIS FEELING");
  s.addText("The work didn’t fail.\nIt just… never finished.", {
    x: 0.7,
    y: 1.0,
    w: 12,
    h: 1.5,
    fontSize: 34,
    color: INK,
    fontFace: "Georgia",
  });
  const cards = [
    { t: "The meeting", d: "Great notes. Zero owners. Zero next actions that stick.", c: MEMORY },
    { t: "The promise", d: "“I’ll send that brief Friday.” Friday becomes never.", c: ACCENT },
    { t: "The agent", d: "It chats. It drafts. Then it forgets the relationship.", c: MOTION },
  ];
  cards.forEach((c, i) => {
    const x = 0.7 + i * 4.15;
    s.addShape(pptx.shapes.RECTANGLE, { x, y: 3.05, w: 3.9, h: 0.08, fill: { color: c.c } });
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y: 3.13,
      w: 3.9,
      h: 2.55,
      fill: { color: SOFT },
    });
    s.addText(c.t, {
      x: x + 0.3,
      y: 3.4,
      w: 3.3,
      h: 0.45,
      fontSize: 20,
      color: INK,
      fontFace: "Georgia",
    });
    s.addText(c.d, {
      x: x + 0.3,
      y: 4.05,
      w: 3.3,
      h: 1.2,
      fontSize: 15,
      color: MUTED,
      fontFace: "Calibri",
    });
  });
  footer(s, 2);
}

// 3 — Name the enemy
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "THE REAL BUG");
  s.addText("Open Loop Debt", {
    x: 0.7,
    y: 1.15,
    w: 12,
    h: 0.85,
    fontSize: 44,
    color: INK,
    fontFace: "Georgia",
  });
  s.addText(
    "Unfinished work that compounds quietly — until a renewal slips,\na customer goes quiet, or a Friday brief never lands.",
    {
      x: 0.7,
      y: 2.2,
      w: 11.5,
      h: 1.1,
      fontSize: 20,
      color: MUTED,
      fontFace: "Calibri",
    },
  );
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 3.7,
    w: 11.9,
    h: 2.15,
    fill: { color: SOFT },
  });
  s.addText("Chatbots remember fragments.\nTask apps track tickets.\nAlmost nothing measures unfinished work — then closes it with memory that lasts.", {
    x: 1.05,
    y: 4.05,
    w: 11.2,
    h: 1.5,
    fontSize: 18,
    color: INK,
    fontFace: "Calibri",
  });
  footer(s, 3);
}

// 4 — Product thesis
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "WHAT CONTINUUM IS");
  s.addText("Memory that moves.", {
    x: 0.7,
    y: 1.05,
    w: 12,
    h: 0.7,
    fontSize: 40,
    color: INK,
    fontFace: "Georgia",
  });
  s.addText(
    "A graph of people, projects, and decisions.\nOpen loops scored by priority × age × dollars at risk.\nCited Motion that writes the result back — so debt actually drops.",
    {
      x: 0.7,
      y: 1.95,
      w: 11.5,
      h: 1.35,
      fontSize: 18,
      color: MUTED,
      fontFace: "Calibri",
    },
  );
  const cols = [
    { c: MEMORY, t: "01  MEMORY", d: "Durable graph — not another chat log" },
    { c: ACCENT, t: "02  DEBT", d: "See $220k before it becomes a surprise" },
    { c: MOTION, t: "03  MOTION", d: "Close the loop. Cite every claim. Write back." },
  ];
  cols.forEach((col, i) => {
    const x = 0.7 + i * 4.15;
    s.addShape(pptx.shapes.RECTANGLE, { x, y: 3.6, w: 3.9, h: 0.1, fill: { color: col.c } });
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y: 3.7,
      w: 3.9,
      h: 2.15,
      fill: { color: SOFT },
    });
    s.addText(col.t, {
      x: x + 0.28,
      y: 3.95,
      w: 3.35,
      h: 0.4,
      fontSize: 14,
      color: col.c,
      bold: true,
      fontFace: "Calibri",
      charSpacing: 1,
    });
    s.addText(col.d, {
      x: x + 0.28,
      y: 4.5,
      w: 3.35,
      h: 1.0,
      fontSize: 16,
      color: INK,
      fontFace: "Calibri",
    });
  });
  footer(s, 4);
}

// 5 — Demo setup / stakes
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "THE STAKES IN THIS ROOM");
  s.addText("$220,000", {
    x: 0.7,
    y: 1.1,
    w: 12,
    h: 1.0,
    fontSize: 64,
    color: ACCENT,
    fontFace: "Georgia",
  });
  s.addText("Acme Health renewal — sitting in open loops right now.", {
    x: 0.7,
    y: 2.25,
    w: 12,
    h: 0.5,
    fontSize: 22,
    color: INK,
    fontFace: "Calibri",
  });
  const rows = [
    ["Maya", "Needs a Friday-ready risk brief"],
    ["Sam", "Flagged onboarding gaps in the QBR"],
    ["Continuum", "Already remembers both — and the unfinished work"],
  ];
  rows.forEach((r, i) => {
    const y = 3.15 + i * 0.95;
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 0.7,
      y,
      w: 11.9,
      h: 0.82,
      fill: { color: SOFT },
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 0.7,
      y,
      w: 0.1,
      h: 0.82,
      fill: { color: i === 2 ? ACCENT : MEMORY },
    });
    s.addText(r[0], {
      x: 1.1,
      y: y + 0.2,
      w: 2.6,
      h: 0.4,
      fontSize: 17,
      color: ACCENT,
      bold: true,
      fontFace: "Calibri",
    });
    s.addText(r[1], {
      x: 3.9,
      y: y + 0.2,
      w: 8.3,
      h: 0.4,
      fontSize: 17,
      color: INK,
      fontFace: "Calibri",
    });
  });
  footer(s, 5);
}

// 6 — Live demo beats
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "WATCH THIS — 75 SECONDS");
  s.addText("Close My Morning", {
    x: 0.7,
    y: 0.95,
    w: 12,
    h: 0.6,
    fontSize: 32,
    color: INK,
    fontFace: "Georgia",
  });
  const steps = [
    ["1", "Debt score", "See Open Loop Debt + $ at risk"],
    ["2", "One click", "Close My Morning queues Cited Motion"],
    ["3", "Live run", "Retrieve → reason → research → artifact"],
    ["4", "The wow", "## Citations + debt before → after"],
  ];
  steps.forEach((st, i) => {
    const x = 0.7 + (i % 2) * 6.2;
    const y = 1.85 + Math.floor(i / 2) * 2.15;
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y,
      w: 5.9,
      h: 1.9,
      fill: { color: SOFT },
    });
    s.addText(st[0], {
      x: x + 0.35,
      y: y + 0.35,
      w: 1.0,
      h: 0.45,
      fontSize: 28,
      color: ACCENT,
      fontFace: "Georgia",
    });
    s.addText(st[1], {
      x: x + 1.4,
      y: y + 0.4,
      w: 4.1,
      h: 0.4,
      fontSize: 20,
      color: INK,
      fontFace: "Georgia",
    });
    s.addText(st[2], {
      x: x + 0.35,
      y: y + 1.1,
      w: 5.2,
      h: 0.4,
      fontSize: 15,
      color: MUTED,
      fontFace: "Calibri",
    });
  });
  footer(s, 6);
}

// 7 — What just happened
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "WHAT JUST HAPPENED");
  s.addText("Not a chat reply.\nA closed loop.", {
    x: 0.7,
    y: 1.1,
    w: 12,
    h: 1.5,
    fontSize: 36,
    color: INK,
    fontFace: "Georgia",
  });
  const bullets = [
    "A renewal-risk brief Maya can actually send",
    "Every claim tied to a memory node she can inspect",
    "The loop marked closed — debt number went down",
    "The artifact written back into the graph for next time",
  ];
  bullets.forEach((b, i) => {
    const y = 2.95 + i * 0.75;
    s.addShape(pptx.shapes.OVAL, {
      x: 0.75,
      y: y + 0.08,
      w: 0.28,
      h: 0.28,
      fill: { color: i === 2 ? ACCENT : MEMORY },
    });
    s.addText(b, {
      x: 1.3,
      y,
      w: 11.2,
      h: 0.45,
      fontSize: 18,
      color: INK,
      fontFace: "Calibri",
    });
  });
  footer(s, 7);
}

// 8 — Architecture / sponsors
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "WHY THIS BELONGS AT MEMORY MEETS MOTION");
  s.addText("Sponsor clients — actually wired.", {
    x: 0.7,
    y: 0.95,
    w: 12,
    h: 0.55,
    fontSize: 28,
    color: INK,
    fontFace: "Georgia",
  });
  const sponsors = [
    ["RocketRide", "Motion pipelines"],
    ["FalkorDB", "Graph memory"],
    ["Linkup", "Live research"],
    ["LaserData", "Event streams"],
    ["Guild.ai", "Experiment runs"],
    ["Snyk", "Ship safely"],
  ];
  sponsors.forEach((sp, i) => {
    const x = 0.7 + (i % 3) * 4.15;
    const y = 1.85 + Math.floor(i / 3) * 2.15;
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y,
      w: 3.95,
      h: 1.9,
      fill: { color: SOFT },
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y,
      w: 3.95,
      h: 0.08,
      fill: { color: i % 2 === 0 ? MEMORY : MOTION },
    });
    s.addText(sp[0], {
      x: x + 0.3,
      y: y + 0.5,
      w: 3.35,
      h: 0.45,
      fontSize: 20,
      color: INK,
      fontFace: "Georgia",
    });
    s.addText(sp[1], {
      x: x + 0.3,
      y: y + 1.1,
      w: 3.35,
      h: 0.4,
      fontSize: 14,
      color: MUTED,
      fontFace: "Calibri",
    });
  });
  footer(s, 8);
}

// 9 — Honesty / moat
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "THE UNFAIR PART");
  s.addText("We measure unfinished work.\nThen we make it finish.", {
    x: 0.7,
    y: 1.15,
    w: 12,
    h: 1.5,
    fontSize: 34,
    color: INK,
    fontFace: "Georgia",
  });
  s.addText(
    "Demo mode stays honest when keys aren’t present.\nConnected mode lights up RocketRide, FalkorDB, Linkup, Laser, Guild, Snyk.\nEither way: debt is real, citations are inspectable, write-back is the product.",
    {
      x: 0.7,
      y: 3.0,
      w: 11.5,
      h: 1.6,
      fontSize: 18,
      color: MUTED,
      fontFace: "Calibri",
    },
  );
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 5.0,
    w: 11.9,
    h: 1.15,
    fill: { color: SOFT },
  });
  s.addText("Not another chatbot. The Open Loop OS.", {
    x: 1.05,
    y: 5.35,
    w: 11.2,
    h: 0.5,
    fontSize: 20,
    color: ACCENT,
    fontFace: "Georgia",
  });
  footer(s, 9);
}

// 10 — Close
{
  const s = pptx.addSlide();
  wash(s);
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 1.9,
    w: 0.12,
    h: 3.0,
    fill: { color: ACCENT },
  });
  s.addText("CLOSE THE LOOP", {
    x: 1.15,
    y: 2.0,
    w: 11,
    h: 0.4,
    fontSize: 13,
    color: ACCENT,
    bold: true,
    fontFace: "Calibri",
    charSpacing: 3,
  });
  s.addText("Continuum", {
    x: 1.15,
    y: 2.5,
    w: 11,
    h: 0.85,
    fontSize: 52,
    color: INK,
    fontFace: "Georgia",
  });
  s.addText("Memory that moves.\nLet’s burn some debt.", {
    x: 1.15,
    y: 3.5,
    w: 11,
    h: 1.0,
    fontSize: 22,
    color: MUTED,
    fontFace: "Calibri",
  });
  s.addText("github.com/vnmoorthy/continuum-memory-meets-motion", {
    x: 1.15,
    y: 5.0,
    w: 11,
    h: 0.4,
    fontSize: 15,
    color: ACCENT,
    fontFace: "Calibri",
  });
  footer(s, 10);
}

const out = path.join(outDir, "Continuum-Memory-Meets-Motion.pptx");
pptx
  .writeFile({ fileName: out })
  .then(() => console.log("Wrote", out))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
