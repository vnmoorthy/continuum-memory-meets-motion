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
pptx.subject = "Memory Meets Motion pitch deck";

const BG = "07090C";
const INK = "ECE6DA";
const MUTED = "9AA3B0";
const ACCENT = "E4FF5C";
const MEMORY = "5EC8C0";
const MOTION = "E8956C";
const SOFT = "0E1218";
const SOFT2 = "151B24";
const ACCENT_INK = "0C1006";

function wash(slide) {
  slide.background = { color: BG };
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: BG },
  });
  // atmospheric blobs
  slide.addShape(pptx.shapes.OVAL, {
    x: -1.5,
    y: -2,
    w: 6,
    h: 5,
    fill: { color: "0A2A28", transparency: 55 },
  });
  slide.addShape(pptx.shapes.OVAL, {
    x: 9.5,
    y: 4.2,
    w: 5.5,
    h: 4.5,
    fill: { color: "2A1A12", transparency: 50 },
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.06,
    fill: { color: ACCENT },
  });
}

function footer(slide, n) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.6,
    y: 6.95,
    w: 12.1,
    h: 0.01,
    fill: { color: "222831" },
  });
  slide.addText("CONTINUUM  ·  OPEN LOOP OS  ·  MEMORY MEETS MOTION", {
    x: 0.6,
    y: 7.05,
    w: 10,
    h: 0.28,
    fontSize: 9,
    color: MUTED,
    fontFace: "Calibri",
    charSpacing: 3,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: 11.8,
    y: 7.05,
    w: 0.9,
    h: 0.28,
    fontSize: 10,
    color: ACCENT,
    align: "right",
    fontFace: "Calibri",
  });
}

function kicker(slide, text) {
  slide.addText(text, {
    x: 0.7,
    y: 0.45,
    w: 12,
    h: 0.35,
    fontSize: 12,
    color: ACCENT,
    fontFace: "Calibri",
    bold: true,
    charSpacing: 4,
  });
}

// 1 Title
{
  const s = pptx.addSlide();
  wash(s);
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 1.55,
    w: 0.12,
    h: 3.4,
    fill: { color: ACCENT },
  });
  s.addText("CONTINUUM", {
    x: 1.15,
    y: 1.7,
    w: 11,
    h: 1.15,
    fontSize: 64,
    bold: true,
    color: INK,
    fontFace: "Georgia",
  });
  s.addText("The Open Loop OS", {
    x: 1.15,
    y: 2.95,
    w: 11,
    h: 0.55,
    fontSize: 28,
    color: ACCENT,
    fontFace: "Georgia",
  });
  s.addText(
    "Measure unfinished work as Open Loop Debt.\nBurn it with Cited Motion. Write results back into memory.",
    {
      x: 1.15,
      y: 3.75,
      w: 10,
      h: 0.9,
      fontSize: 16,
      color: MUTED,
      fontFace: "Calibri",
    },
  );
  s.addText("Memory Meets Motion  ·  Agentic Workflows & Stateful AI", {
    x: 1.15,
    y: 5.0,
    w: 10,
    h: 0.35,
    fontSize: 12,
    color: MEMORY,
    fontFace: "Calibri",
    charSpacing: 2,
  });
  footer(s, 1);
}

// 2 Problem
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "THE PROBLEM");
  s.addText("Residue piles up.\nAI either remembers or acts — rarely both.", {
    x: 0.7,
    y: 1.0,
    w: 12,
    h: 1.5,
    fontSize: 34,
    color: INK,
    fontFace: "Georgia",
  });
  const cards = [
    { t: "Meetings", d: "Notes without owners or next actions", c: MEMORY },
    { t: "Promises", d: "Slack commitments that evaporate", c: ACCENT },
    { t: "Agents", d: "Act once, forget the relationship graph", c: MOTION },
  ];
  cards.forEach((c, i) => {
    const x = 0.7 + i * 4.15;
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y: 3.1,
      w: 3.9,
      h: 0.08,
      fill: { color: c.c },
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y: 3.18,
      w: 3.9,
      h: 2.5,
      fill: { color: SOFT },
    });
    s.addText(c.t, {
      x: x + 0.3,
      y: 3.5,
      w: 3.3,
      h: 0.5,
      fontSize: 22,
      color: INK,
      fontFace: "Georgia",
    });
    s.addText(c.d, {
      x: x + 0.3,
      y: 4.2,
      w: 3.3,
      h: 1.0,
      fontSize: 15,
      color: MUTED,
      fontFace: "Calibri",
    });
  });
  footer(s, 2);
}

// 3 Insight
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "THE INSIGHT");
  s.addText("Memory Meets Motion is one loop.", {
    x: 0.7,
    y: 1.1,
    w: 12,
    h: 0.8,
    fontSize: 36,
    color: INK,
    fontFace: "Georgia",
  });
  s.addText(
    "Durable context must power autonomous execution.\nEvery action must write back into memory — or the debt returns.",
    {
      x: 0.7,
      y: 2.1,
      w: 11.5,
      h: 1.0,
      fontSize: 18,
      color: MUTED,
      fontFace: "Calibri",
    },
  );
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 3.6,
    w: 11.9,
    h: 2.1,
    fill: { color: SOFT },
  });
  s.addText("Residue  →  Graph Memory  →  Open Loops  →  Motion  →  Write-back  →  Closed", {
    x: 1.0,
    y: 4.3,
    w: 11.3,
    h: 0.7,
    fontSize: 17,
    color: ACCENT,
    bold: true,
    align: "center",
    fontFace: "Calibri",
  });
  footer(s, 3);
}

// 4 Product
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "THE PRODUCT");
  s.addText("Continuum", {
    x: 0.7,
    y: 1.0,
    w: 12,
    h: 0.7,
    fontSize: 42,
    color: INK,
    fontFace: "Georgia",
  });
  s.addText(
    "Open Loop OS — a knowledge graph of organizational memory that powers agents to close unfinished work, with citations, then gets smarter every time it acts.",
    {
      x: 0.7,
      y: 1.8,
      w: 11.5,
      h: 1.0,
      fontSize: 17,
      color: MUTED,
      fontFace: "Calibri",
    },
  );
  const cols = [
    { c: MEMORY, t: "MEMORY", d: "People, projects, decisions, artifacts, loops as a property graph" },
    { c: ACCENT, t: "DEBT", d: "Open loops scored by priority × age × unique $ at risk" },
    { c: MOTION, t: "MOTION", d: "Cited agents retrieve, act, write back — debt burns" },
  ];
  cols.forEach((col, i) => {
    const x = 0.7 + i * 4.15;
    s.addShape(pptx.shapes.RECTANGLE, { x, y: 3.2, w: 3.9, h: 0.1, fill: { color: col.c } });
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y: 3.3,
      w: 3.9,
      h: 2.5,
      fill: { color: SOFT },
    });
    s.addText(col.t, {
      x: x + 0.28,
      y: 3.55,
      w: 3.3,
      h: 0.4,
      fontSize: 14,
      color: col.c,
      bold: true,
      fontFace: "Calibri",
      charSpacing: 2,
    });
    s.addText(col.d, {
      x: x + 0.28,
      y: 4.15,
      w: 3.3,
      h: 1.3,
      fontSize: 15,
      color: INK,
      fontFace: "Calibri",
    });
  });
  footer(s, 4);
}

// 5 Demo world
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "LIVE DEMO");
  s.addText("Seed world: Northstar × Acme Health", {
    x: 0.7,
    y: 1.0,
    w: 12,
    h: 0.7,
    fontSize: 30,
    color: INK,
    fontFace: "Georgia",
  });
  const items = [
    { t: "Graph", d: "Maya, Sam, Acme renewal, QBR notes — linked" },
    { t: "Debt", d: "$268k unique risk · Acme $220k counted once" },
    { t: "Loop", d: "Draft Acme renewal-risk brief for Maya (P1)" },
    { t: "Close", d: "One click → Cited Motion → write-back → debt drops" },
  ];
  items.forEach((it, i) => {
    const y = 2.0 + i * 1.05;
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 0.7,
      y,
      w: 11.9,
      h: 0.9,
      fill: { color: SOFT },
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 0.7,
      y,
      w: 0.1,
      h: 0.9,
      fill: { color: i % 2 === 0 ? MEMORY : MOTION },
    });
    s.addText(it.t, {
      x: 1.1,
      y: y + 0.22,
      w: 2.2,
      h: 0.45,
      fontSize: 16,
      color: ACCENT,
      bold: true,
      fontFace: "Calibri",
    });
    s.addText(it.d, {
      x: 3.4,
      y: y + 0.22,
      w: 8.8,
      h: 0.45,
      fontSize: 16,
      color: INK,
      fontFace: "Calibri",
    });
  });
  footer(s, 5);
}

// 6 Pipeline
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "MOTION PIPELINE");
  s.addText("close-open-loop", {
    x: 0.7,
    y: 0.95,
    w: 12,
    h: 0.55,
    fontSize: 30,
    color: INK,
    fontFace: "Georgia",
  });
  const steps = [
    ["01", "Retrieve", "Memory subgraph", MEMORY],
    ["02", "Reason", "Owners & pressure", MEMORY],
    ["03", "Enrich", "Linkup context", ACCENT],
    ["04", "Act", "Cited artifact", MOTION],
    ["05", "Write", "Close the loop", MOTION],
    ["06", "Notify", "Laser + Guild", MOTION],
  ];
  steps.forEach((st, i) => {
    const x = 0.7 + (i % 3) * 4.15;
    const y = 1.85 + Math.floor(i / 3) * 2.25;
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y,
      w: 3.95,
      h: 2.0,
      fill: { color: SOFT },
    });
    s.addText(st[0], {
      x: x + 0.28,
      y: y + 0.28,
      w: 3.4,
      h: 0.3,
      fontSize: 12,
      color: st[3],
      fontFace: "Calibri",
      bold: true,
    });
    s.addText(st[1], {
      x: x + 0.28,
      y: y + 0.7,
      w: 3.4,
      h: 0.45,
      fontSize: 22,
      color: INK,
      fontFace: "Georgia",
    });
    s.addText(st[2], {
      x: x + 0.28,
      y: y + 1.25,
      w: 3.4,
      h: 0.35,
      fontSize: 14,
      color: MUTED,
      fontFace: "Calibri",
    });
  });
  footer(s, 6);
}

// 7 Result
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "THE RESULT");
  s.addText("An executive brief.\nA closed loop.\nA smarter graph.", {
    x: 0.7,
    y: 1.15,
    w: 12,
    h: 2.3,
    fontSize: 36,
    color: INK,
    fontFace: "Georgia",
  });
  s.addText(
    "Motion doesn’t end in chat. It ends as durable memory — artifacts, edges, and status the next agent can trust. Citations are inspectable. Debt is measurable.",
    {
      x: 0.7,
      y: 3.7,
      w: 11.5,
      h: 1.1,
      fontSize: 17,
      color: MUTED,
      fontFace: "Calibri",
    },
  );
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 5.1,
    w: 11.9,
    h: 1.15,
    fill: { color: SOFT },
  });
  s.addText("Judge cue: /app → Close My Morning → /app/runs → scroll ## Citations → debt before→after", {
    x: 1.0,
    y: 5.4,
    w: 11.3,
    h: 0.55,
    fontSize: 15,
    color: ACCENT,
    fontFace: "Calibri",
  });
  footer(s, 7);
}

// 8 Architecture
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "ARCHITECTURE");
  s.addText("Stateful substrate for agentic work", {
    x: 0.7,
    y: 0.95,
    w: 12,
    h: 0.55,
    fontSize: 28,
    color: INK,
    fontFace: "Georgia",
  });
  const layers = [
    { t: "Web", d: "Command · Graph · Loops · Runs · Settings", c: ACCENT },
    { t: "API", d: "REST · SSE · Zod contracts · demo sessions", c: MEMORY },
    { t: "Memory", d: "SQLite WAL · optional FalkorDB mirror", c: MEMORY },
    { t: "Motion", d: "Leased jobs · RocketRide · Linkup · Laser · Guild", c: MOTION },
  ];
  layers.forEach((l, i) => {
    const y = 1.8 + i * 1.1;
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 0.7,
      y,
      w: 11.9,
      h: 0.95,
      fill: { color: SOFT },
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 0.7,
      y,
      w: 0.12,
      h: 0.95,
      fill: { color: l.c },
    });
    s.addText(l.t, {
      x: 1.15,
      y: y + 0.22,
      w: 2.5,
      h: 0.5,
      fontSize: 18,
      color: INK,
      bold: true,
      fontFace: "Calibri",
    });
    s.addText(l.d, {
      x: 4.0,
      y: y + 0.22,
      w: 8.2,
      h: 0.5,
      fontSize: 16,
      color: MUTED,
      fontFace: "Calibri",
    });
  });
  footer(s, 8);
}

// 9 Sponsors
{
  const s = pptx.addSlide();
  wash(s);
  kicker(s, "SPONSOR SDKS — ALL WIRED");
  s.addText("Real clients. Honest DEMO fallbacks.", {
    x: 0.7,
    y: 0.95,
    w: 12,
    h: 0.55,
    fontSize: 28,
    color: INK,
    fontFace: "Georgia",
  });
  const sponsors = [
    ["RocketRide", "Pipeline submit", MOTION],
    ["FalkorDB", "Graph mirror", MEMORY],
    ["Linkup", "Live research", ACCENT],
    ["LaserData", "Event streams", MEMORY],
    ["Guild.ai", "Experiment runs", ACCENT],
    ["Snyk", "Security scan", MOTION],
  ];
  sponsors.forEach((sp, i) => {
    const x = 0.7 + (i % 3) * 4.15;
    const y = 1.85 + Math.floor(i / 3) * 2.2;
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y,
      w: 3.95,
      h: 1.95,
      fill: { color: SOFT },
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y,
      w: 3.95,
      h: 0.08,
      fill: { color: sp[2] },
    });
    s.addText(sp[0], {
      x: x + 0.3,
      y: y + 0.45,
      w: 3.3,
      h: 0.5,
      fontSize: 20,
      color: INK,
      fontFace: "Georgia",
    });
    s.addText(sp[1], {
      x: x + 0.3,
      y: y + 1.1,
      w: 3.3,
      h: 0.4,
      fontSize: 14,
      color: MUTED,
      fontFace: "Calibri",
    });
  });
  footer(s, 9);
}

// 10 Close
{
  const s = pptx.addSlide();
  wash(s);
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.7,
    y: 2.0,
    w: 0.12,
    h: 2.8,
    fill: { color: ACCENT },
  });
  s.addText("CLOSE THE LOOP", {
    x: 1.15,
    y: 2.1,
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
    y: 2.6,
    w: 11,
    h: 0.9,
    fontSize: 52,
    color: INK,
    fontFace: "Georgia",
  });
  s.addText("Memory that moves.\nThank you — questions welcome.", {
    x: 1.15,
    y: 3.6,
    w: 11,
    h: 1.0,
    fontSize: 22,
    color: MUTED,
    fontFace: "Calibri",
  });
  s.addText("github.com/vnmoorthy/continuum-memory-meets-motion", {
    x: 1.15,
    y: 5.1,
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
