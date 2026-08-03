# Continuum — 3-minute storyboard (Open Loop OS)

Deck: [`slides/Continuum-Memory-Meets-Motion.pptx`](../slides/Continuum-Memory-Meets-Motion.pptx)  
Local demo: **http://localhost:3000**

---

## Timing

| Time | Beat | Visual |
| --- | --- | --- |
| 0:00–0:20 | Hook | Slide 1 + say Continuum |
| 0:20–0:45 | Problem | Slide 2 Open Loop Debt |
| 0:45–1:05 | Product | Slide 3–4 |
| 1:05–2:20 | **Live demo** | Laptop `/app` |
| 2:20–2:45 | Architecture + sponsors | Slide 8–9 |
| 2:45–3:00 | Close | Slide 10 |

---

## Script

### 0:00 — Hook
“This is **Continuum** — the **Open Loop OS**. Memory that doesn’t just recall — it **closes unfinished work**.”

### 0:20 — Problem
“Every team accrues **Open Loop Debt**: meetings, promises, renewals. Chatbots summarize it. Agents sometimes act. Almost nothing **measures** that debt or **closes** it with durable memory.”

### 0:45 — Product
“Continuum stores organizational memory as a graph, scores open loops by priority × age × dollars at risk, then runs **Cited Motion** pipelines that write results back — so debt goes down.”

### 1:05 — Live demo (primary)
1. `/app` — point at **Open Loop Debt** and **$ at risk** (Acme **$220k**).  
2. Click **Close My Morning** (or Close the Acme brief).  
3. `/app/runs` — narrate retrieve → reason → cited artifact → write-back.  
4. Scroll to **## Citations** — “Every claim is grounded in memory nodes.”  
5. Show debt **before → after**.  

Optional 10s: Watchdogs **Scan now**, or ingest residue on `/app/loops`.

### 2:20 — Architecture
“FalkorDB-style graph memory. RocketRide-compatible pipeline JSON. Linkup-style live context. LaserData-style watchdog triggers. Stateful write-back closes the loop.”

### 2:45 — Close
“Continuum isn’t another chatbot — it’s the substrate that makes Memory meet Motion. **Close the loop.**”

---

## Judge FAQ (one-liners)

- **What’s novel?** Open Loop Debt + Cited Motion write-back.  
- **Why sponsors?** Pipeline JSON (RocketRide), graph memory (FalkorDB), research (Linkup), event triggers (LaserData).  
- **What if offline?** Full local runtime — demo always works.

## Pre-flight
- [ ] `npm run dev`  
- [ ] Settings → Reset memory to seed  
- [ ] Zoom for projector  
- [ ] Know Acme $220k talking point
