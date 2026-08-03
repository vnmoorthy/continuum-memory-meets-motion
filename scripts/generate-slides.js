const PptxGenJS = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "..", "slides");
fs.mkdirSync(outDir, { recursive: true });

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "Continuum";
pptx.title = "Continuum — Memory Meets Motion";
pptx.subject = "Hackathon pitch deck";

const BG = "0A0C0F";
const INK = "F3EFE7";
const MUTED = "8F96A3";
const ACCENT = "D6FF4B";
const MEMORY = "6EA8FF";
const MOTION = "FF8F5A";
const SOFT = "171C24";

function base(slide) {
  slide.background = { color: BG };
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.08,
    fill: { color: ACCENT },
  });
}

function footer(slide, n) {
  slide.addText("CONTINUUM  ·  MEMORY MEETS MOTION", {
    x: 0.6,
    y: 7.05,
    w: 10,
    h: 0.3,
    fontSize: 10,
    color: MUTED,
    fontFace: "Arial",
  });
  slide.addText(String(n), {
    x: 12.2,
    y: 7.05,
    w: 0.6,
    h: 0.3,
    fontSize: 10,
    color: MUTED,
    align: "right",
    fontFace: "Arial",
  });
}

// 1 Title
{
  const s = pptx.addSlide();
  base(s);
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.6,
    y: 1.8,
    w: 0.18,
    h: 2.8,
    fill: { color: ACCENT },
  });
  s.addText("CONTINUUM", {
    x: 1.1,
    y: 1.9,
    w: 11,
    h: 1.2,
    fontSize: 60,
    bold: true,
    color: INK,
    fontFace: "Arial",
  });
  s.addText("The Open Loop OS.", {
    x: 1.1,
    y: 3.1,
    w: 11,
    h: 0.6,
    fontSize: 28,
    color: ACCENT,
    fontFace: "Arial",
  });
  s.addText(
    "Measure Open Loop Debt. Burn it with Cited Motion. Write results back into memory.\nBuilt for Memory Meets Motion · Agentic Workflows & Stateful AI",
    {
      x: 1.1,
      y: 4.0,
      w: 10,
      h: 1.0,
      fontSize: 16,
      color: MUTED,
      fontFace: "Arial",
    },
  );
  footer(s, 1);
}

// 2 Problem
{
  const s = pptx.addSlide();
  base(s);
  s.addText("THE PROBLEM", {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 14,
    color: ACCENT,
    fontFace: "Arial",
    bold: true,
  });
  s.addText("Organizations drown in residue.\nAI either remembers or acts — rarely both.", {
    x: 0.6,
    y: 1.1,
    w: 12,
    h: 1.4,
    fontSize: 32,
    color: INK,
    fontFace: "Arial",
    bold: true,
  });
  const cards = [
    { t: "Meetings", d: "Notes without owners or next actions" },
    { t: "Promises", d: "Slack commitments that evaporate" },
    { t: "Agents", d: "Act once, forget the relationship graph" },
  ];
  cards.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y: 3.2,
      w: 3.8,
      h: 2.4,
      fill: { color: SOFT },
    });
    s.addText(c.t, {
      x: x + 0.3,
      y: 3.5,
      w: 3.2,
      h: 0.5,
      fontSize: 20,
      color: INK,
      bold: true,
      fontFace: "Arial",
    });
    s.addText(c.d, {
      x: x + 0.3,
      y: 4.2,
      w: 3.2,
      h: 1.0,
      fontSize: 14,
      color: MUTED,
      fontFace: "Arial",
    });
  });
  footer(s, 2);
}

// 3 Insight
{
  const s = pptx.addSlide();
  base(s);
  s.addText("THE INSIGHT", {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 14,
    color: ACCENT,
    bold: true,
    fontFace: "Arial",
  });
  s.addText("Memory Meets Motion is one loop.", {
    x: 0.6,
    y: 1.2,
    w: 12,
    h: 0.8,
    fontSize: 34,
    color: INK,
    bold: true,
    fontFace: "Arial",
  });
  s.addText(
    "Durable context must power autonomous execution.\nEvery action must write back into memory.",
    {
      x: 0.6,
      y: 2.2,
      w: 12,
      h: 1.0,
      fontSize: 20,
      color: MUTED,
      fontFace: "Arial",
    },
  );
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.6,
    y: 3.6,
    w: 12.1,
    h: 2.2,
    fill: { color: SOFT },
    rectRadius: 0.05,
  });
  s.addText("Residue  →  Graph Memory  →  Open Loops  →  Motion  →  Write-back  →  Closed", {
    x: 0.9,
    y: 4.3,
    w: 11.5,
    h: 0.7,
    fontSize: 18,
    color: ACCENT,
    bold: true,
    align: "center",
    fontFace: "Arial",
  });
  footer(s, 3);
}

// 4 Product
{
  const s = pptx.addSlide();
  base(s);
  s.addText("THE PRODUCT", {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 14,
    color: ACCENT,
    bold: true,
    fontFace: "Arial",
  });
  s.addText("Continuum", {
    x: 0.6,
    y: 1.1,
    w: 12,
    h: 0.7,
    fontSize: 40,
    color: INK,
    bold: true,
    fontFace: "Arial",
  });
  s.addText(
    "A knowledge graph of organizational memory that powers agents to close open loops — and gets smarter every time it acts.",
    {
      x: 0.6,
      y: 1.9,
      w: 11.5,
      h: 1.0,
      fontSize: 18,
      color: MUTED,
      fontFace: "Arial",
    },
  );
  const cols = [
    { c: MEMORY, t: "MEMORY", d: "People, projects, decisions, artifacts, loops as a property graph" },
    { c: ACCENT, t: "BRIDGE", d: "Open loops carry context, priority, and suggested actions" },
    { c: MOTION, t: "MOTION", d: "RocketRide-compatible pipelines retrieve, act, and write back" },
  ];
  cols.forEach((col, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pptx.shapes.RECTANGLE, { x, y: 3.3, w: 3.8, h: 0.12, fill: { color: col.c } });
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y: 3.42,
      w: 3.8,
      h: 2.4,
      fill: { color: SOFT },
    });
    s.addText(col.t, {
      x: x + 0.25,
      y: 3.7,
      w: 3.3,
      h: 0.4,
      fontSize: 16,
      color: col.c,
      bold: true,
      fontFace: "Arial",
    });
    s.addText(col.d, {
      x: x + 0.25,
      y: 4.3,
      w: 3.3,
      h: 1.2,
      fontSize: 14,
      color: INK,
      fontFace: "Arial",
    });
  });
  footer(s, 4);
}

// 5 Demo setup
{
  const s = pptx.addSlide();
  base(s);
  s.addText("LIVE DEMO", {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 14,
    color: ACCENT,
    bold: true,
    fontFace: "Arial",
  });
  s.addText("Seed world: Northstar × Acme Health", {
    x: 0.6,
    y: 1.1,
    w: 12,
    h: 0.7,
    fontSize: 30,
    color: INK,
    bold: true,
    fontFace: "Arial",
  });
  const items = [
    "Memory graph links Maya, Sam, Acme renewal, QBR notes",
    "Open loop: Draft Acme renewal-risk brief for Maya (P1)",
    "One click starts the close-open-loop Motion pipeline",
    "Artifact writes back; loop status becomes closed",
  ];
  items.forEach((t, i) => {
    s.addShape(pptx.shapes.OVAL, {
      x: 0.7,
      y: 2.2 + i * 0.9,
      w: 0.35,
      h: 0.35,
      fill: { color: ACCENT },
    });
    s.addText(String(i + 1), {
      x: 0.7,
      y: 2.22 + i * 0.9,
      w: 0.35,
      h: 0.35,
      fontSize: 12,
      color: BG,
      align: "center",
      valign: "middle",
      bold: true,
      fontFace: "Arial",
    });
    s.addText(t, {
      x: 1.3,
      y: 2.15 + i * 0.9,
      w: 11,
      h: 0.5,
      fontSize: 18,
      color: INK,
      fontFace: "Arial",
    });
  });
  footer(s, 5);
}

// 6 Demo motion
{
  const s = pptx.addSlide();
  base(s);
  s.addText("MOTION PIPELINE", {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 14,
    color: ACCENT,
    bold: true,
    fontFace: "Arial",
  });
  s.addText("close-open-loop.json", {
    x: 0.6,
    y: 1.0,
    w: 12,
    h: 0.6,
    fontSize: 28,
    color: INK,
    bold: true,
    fontFace: "Arial",
  });
  const steps = [
    ["Retrieve", "Memory subgraph"],
    ["Reason", "Owners & pressure"],
    ["Enrich", "Live web context"],
    ["Act", "Draft artifact"],
    ["Write", "Close the loop"],
    ["Notify", "Surface result"],
  ];
  steps.forEach((st, i) => {
    const x = 0.55 + (i % 3) * 4.2;
    const y = 2.0 + Math.floor(i / 3) * 2.2;
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y,
      w: 3.9,
      h: 1.9,
      fill: { color: SOFT },
    });
    s.addText(`0${i + 1}`, {
      x: x + 0.25,
      y: y + 0.3,
      w: 3.4,
      h: 0.35,
      fontSize: 12,
      color: MOTION,
      fontFace: "Arial",
      bold: true,
    });
    s.addText(st[0], {
      x: x + 0.25,
      y: y + 0.7,
      w: 3.4,
      h: 0.4,
      fontSize: 22,
      color: INK,
      bold: true,
      fontFace: "Arial",
    });
    s.addText(st[1], {
      x: x + 0.25,
      y: y + 1.2,
      w: 3.4,
      h: 0.35,
      fontSize: 14,
      color: MUTED,
      fontFace: "Arial",
    });
  });
  footer(s, 6);
}

// 7 Demo result
{
  const s = pptx.addSlide();
  base(s);
  s.addText("THE RESULT", {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 14,
    color: ACCENT,
    bold: true,
    fontFace: "Arial",
  });
  s.addText("An executive brief.\nA closed loop.\nA smarter graph.", {
    x: 0.6,
    y: 1.2,
    w: 12,
    h: 2.0,
    fontSize: 34,
    color: INK,
    bold: true,
    fontFace: "Arial",
  });
  s.addText(
    "Motion doesn’t end in chat. It ends as durable memory — artifacts, edges, and status the next agent can trust.",
    {
      x: 0.6,
      y: 3.6,
      w: 11.5,
      h: 1.2,
      fontSize: 18,
      color: MUTED,
      fontFace: "Arial",
    },
  );
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0.6,
    y: 5.1,
    w: 12.1,
    h: 1.2,
    fill: { color: SOFT },
  });
  s.addText("Judge cue: switch to /app/runs and scroll the generated Acme Renewal Risk Brief.", {
    x: 0.9,
    y: 5.4,
    w: 11.5,
    h: 0.6,
    fontSize: 16,
    color: ACCENT,
    fontFace: "Arial",
  });
  footer(s, 7);
}

// 8 Architecture
{
  const s = pptx.addSlide();
  base(s);
  s.addText("ARCHITECTURE", {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 14,
    color: ACCENT,
    bold: true,
    fontFace: "Arial",
  });
  s.addText("Stateful substrate for agentic work", {
    x: 0.6,
    y: 1.0,
    w: 12,
    h: 0.6,
    fontSize: 28,
    color: INK,
    bold: true,
    fontFace: "Arial",
  });
  const layers = [
    { t: "Web App", d: "Command · Graph · Loops · Runs", c: INK },
    { t: "API + SSE", d: "REST surface + live telemetry", c: MEMORY },
    { t: "Memory Plane", d: "Graph store · search · subgraph", c: MEMORY },
    { t: "Motion Plane", d: "Pipeline runtime · artifacts", c: MOTION },
  ];
  layers.forEach((l, i) => {
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 0.6,
      y: 1.9 + i * 1.1,
      w: 12.1,
      h: 0.95,
      fill: { color: SOFT },
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x: 0.6,
      y: 1.9 + i * 1.1,
      w: 0.15,
      h: 0.95,
      fill: { color: l.c === INK ? ACCENT : l.c },
    });
    s.addText(l.t, {
      x: 1.1,
      y: 2.05 + i * 1.1,
      w: 4,
      h: 0.6,
      fontSize: 18,
      color: INK,
      bold: true,
      fontFace: "Arial",
      valign: "middle",
    });
    s.addText(l.d, {
      x: 5.5,
      y: 2.05 + i * 1.1,
      w: 6.8,
      h: 0.6,
      fontSize: 16,
      color: MUTED,
      fontFace: "Arial",
      valign: "middle",
    });
  });
  footer(s, 8);
}

// 9 Sponsors / moat
{
  const s = pptx.addSlide();
  base(s);
  s.addText("BUILT FOR THE STACK", {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 14,
    color: ACCENT,
    bold: true,
    fontFace: "Arial",
  });
  s.addText("Sponsor-native by design", {
    x: 0.6,
    y: 1.1,
    w: 12,
    h: 0.6,
    fontSize: 30,
    color: INK,
    bold: true,
    fontFace: "Arial",
  });
  const sponsors = [
    ["RocketRide", "Portable Motion pipelines"],
    ["FalkorDB", "Low-latency graph memory"],
    ["Linkup", "Live web context"],
    ["LaserData", "Durable event streams"],
  ];
  sponsors.forEach((sp, i) => {
    const x = 0.6 + (i % 2) * 6.3;
    const y = 2.1 + Math.floor(i / 2) * 2.0;
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y,
      w: 5.9,
      h: 1.7,
      fill: { color: SOFT },
    });
    s.addText(sp[0], {
      x: x + 0.35,
      y: y + 0.35,
      w: 5.2,
      h: 0.45,
      fontSize: 22,
      color: ACCENT,
      bold: true,
      fontFace: "Arial",
    });
    s.addText(sp[1], {
      x: x + 0.35,
      y: y + 0.9,
      w: 5.2,
      h: 0.45,
      fontSize: 16,
      color: MUTED,
      fontFace: "Arial",
    });
  });
  footer(s, 9);
}

// 10 Close
{
  const s = pptx.addSlide();
  base(s);
  s.addText("CLOSE THE LOOP", {
    x: 0.6,
    y: 2.0,
    w: 12,
    h: 0.5,
    fontSize: 14,
    color: ACCENT,
    bold: true,
    fontFace: "Arial",
  });
  s.addText("Continuum", {
    x: 0.6,
    y: 2.6,
    w: 12,
    h: 0.9,
    fontSize: 48,
    color: INK,
    bold: true,
    fontFace: "Arial",
  });
  s.addText("Memory that moves.\nThank you — questions welcome.", {
    x: 0.6,
    y: 3.6,
    w: 12,
    h: 1.2,
    fontSize: 24,
    color: MUTED,
    fontFace: "Arial",
  });
  s.addText("github.com/vnmoorthy/continuum-memory-meets-motion", {
    x: 0.6,
    y: 5.3,
    w: 12,
    h: 0.4,
    fontSize: 16,
    color: ACCENT,
    fontFace: "Arial",
  });
  footer(s, 10);
}

const out = path.join(outDir, "Continuum-Memory-Meets-Motion.pptx");
pptx
  .writeFile({ fileName: out })
  .then(() => {
    console.log("Wrote", out);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
