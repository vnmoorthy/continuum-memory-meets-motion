# Continuum — 3-minute demo VIDEO storyboard

Use this to record a product demo video (screen + voice).  
Live: https://continuum-memory-meets-motion.vercel.app  
Local: http://localhost:3000  
Deck B-roll (optional cutaways): `slides/Continuum-Memory-Meets-Motion.pptx`

**Tone:** calm, human, a little cinematic. You’re showing a finished loop — not a feature tour.  
**Pre-record (60s):** Settings → **Reset memory to seed**. Close extra tabs. Browser zoom ~110%. Cursor size large. Mic check. Hide bookmarks bar.

---

## Sponsor tools — yes, we use them in the product

Continuum **imports and invokes all six Memory Meets Motion sponsor client SDKs**. They are not logo wallpaper.

| Sponsor | Package in the app | Where it runs in the demo |
| --- | --- | --- |
| **RocketRide** | `rocketride` | Motion tries to submit `pipelines/close-open-loop.json` (local worker always runs; Cloud when `ROCKETRIDE_APIKEY` is set) |
| **FalkorDB** | `falkordb` | After write-back, mirrors artifact nodes/edges into FalkorDB when `FALKORDB_HOST` is set |
| **Linkup** | `linkup-sdk` | Research step during Motion (`linkupResearch`) — live search with `LINKUP_API_KEY`, else labeled DEMO findings |
| **LaserData** | `@laserdata/laser-sdk` | Publishes Motion + watchdog events (`continuum.events` / JSONL fallback) |
| **Guild.ai** | `@guildai/cli` + `.guild/continuum-runs/` | Writes a Guild-format experiment record when a run completes |
| **Snyk** | `snyk` | Settings → **Run Snyk scan** / `npm run snyk:test` |

**On camera honesty line (required):**  
“Every sponsor SDK is installed and called in the Motion path. Without API keys we stay in labeled DEMO — we don’t fake live delivery.”

Show it: `/app/settings` → **Sponsor SDKs** panel (all six rows, `sdkLoaded`) or `GET /api/sponsors`.

---

## Shot list (exactly 3:00)

| Time | Visual on screen | VO / action | Notes |
| --- | --- | --- | --- |
| **0:00–0:12** | Black → fade into `/` landing (Continuum hero + mesh) | Soft: “Somewhere in your company, unfinished work is quietly getting expensive.” | Hold on brand. No mouse flailing. |
| **0:12–0:28** | Still on `/`, just brand | “In our world, that number is **two hundred and twenty thousand dollars** — an Acme Health renewal stuck in open loops. This is **Continuum**. The Open Loop OS.” | Say Continuum once, clearly. |
| **0:28–0:38** | Click **Enter / Open Continuum** → `/app` | “Memory that doesn’t just recall… it finishes.” | Let Command settle. |
| **0:38–0:55** | Cursor to **Open Loop Debt**, then **$ at risk** | “Here’s Open Loop Debt. And here’s dollars at risk. Maya needs a Friday brief. Sam already flagged the gaps. Continuum already remembers both.” | Slow cursor. |
| **0:55–1:05** | Hover **Close My Morning** | “One click.” | Beat of silence. |
| **1:05–1:35** | Click → `/app/runs` as Motion runs | Quiet. Optional: “Pulling memory… RocketRide pipeline path… Linkup research step…” | **Wow #1:** don’t over-narrate. |
| **1:35–2:00** | Scroll steps → stop on **`## Citations`** | “Every claim points back to a memory node you can inspect — Maya, Sam, the QBR, the renewal. Not vibes.” | **Wow #2** |
| **2:00–2:15** | Debt **before → after** / loop closed | “Debt before… after. Loop closed. Brief is back in the graph — FalkorDB mirror path, Laser event, Guild experiment record.” | **Wow #3** |
| **2:15–2:42** | **`/app/settings` → Sponsor SDKs** | Name all six out loud while scrolling rows: “RocketRide, FalkorDB, Linkup, LaserData, Guild, Snyk — real client packages, called from Motion. No keys? Labeled DEMO. We don’t pretend.” | Hold Snyk “Run Snyk scan” button 1s. |
| **2:42–3:00** | `/` or end card | “Continuum. Memory that moves. Close the loop.” | Freeze + URL. |

---

## End card (last 3 seconds)

```text
Continuum — Open Loop OS
Sponsors wired: RocketRide · FalkorDB · Linkup · LaserData · Guild · Snyk
https://continuum-memory-meets-motion.vercel.app
github.com/vnmoorthy/continuum-memory-meets-motion
```

---

## Spoken script (one take)

> Somewhere in your company, unfinished work is quietly getting expensive.  
> In our world, that number is two hundred and twenty thousand dollars — an Acme Health renewal stuck in open loops.  
> This is Continuum. The Open Loop OS. Memory that doesn’t just recall… it finishes.  
>  
> Here’s Open Loop Debt. Here’s dollars at risk. Maya needs a Friday brief. Sam already flagged the gaps. Continuum already remembers both.  
> One click — Close My Morning.  
>  
> *(pause while Motion runs)*  
>  
> Every claim points back to a memory node you can inspect. Not vibes.  
> Debt before… after. Loop closed. The brief is back in the graph.  
>  
> And yes — we actually use the sponsor tools. RocketRide for the pipeline path, FalkorDB for graph mirror, Linkup for research, LaserData for events, Guild for experiment records, Snyk for security scans. They’re installed client SDKs in the product. Without keys we stay labeled DEMO — we don’t fake live.  
>  
> Continuum. Memory that moves. Close the loop.

---

## Edit checklist

- [ ] Reset seed before the keeper take  
- [ ] Captions: `$220k` · `Citations` · `before → after` · sponsor names  
- [ ] Include **Settings → Sponsor SDKs** shot (proof we used the tools)  
- [ ] No desktop notifications  
- [ ] Music: low / no lyrics (or silence)  
- [ ] Export 1080p, ≤3:05 including end card  
- [ ] Thumbnail: Continuum + “$220k” + “6 sponsor SDKs”

## If something glitches mid-take

Keep rolling 2 seconds, then: “Resetting the seed — same path.” Cut in edit. Don’t apologize on camera more than once.
