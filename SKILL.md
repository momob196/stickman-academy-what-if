---
name: what-if-animation
description: Make a "What If" animated episode from one topic line ("What if you could rewind 10 seconds?"), in the dusk-lit stick-figure style of the What If channels that broke out on YouTube in October 2026. Writes the script on the seven-beat What If formula, voices it with ElevenLabs, lays out a shot list at the genre's pace, renders a storyboard of stills and self-checks it before animating, animates every frame in code (Remotion and SVG, with an original cast on one rig, rooms in perspective and light from lamps and windows), generates and syncs the sound, and masters a finished 15-25 s episode to -14 LUFS. Use when someone asks for a What If episode, animation or cartoon, "make a what if video about X", a stick-figure explainer in this style, or to run the free What If skill.
---

# What If animation

One topic line in, a finished 15-25 second episode out. Every frame is SVG that Claude writes (rendered by
Remotion); the voice and the sound come from ElevenLabs. Two examples ship in `studio/src/episodes/`, both ready to
render: `rewind` ("What if you could rewind 10 seconds?", the proof clip: shots played backwards as the power) and
`copy-paste` ("What if you could copy and paste anything?", the skill's first full run: a new kitchen set, a
schematic for the science beat, a cliffhanger blackout). Read the one closest to your topic before you start.

| File | What's in it |
|---|---|
| `references/formula.md` | The seven-beat What If formula, the 15-25 s shape, script rules, choosing a topic |
| `references/look.md` | The measured look, pace, shot vocabulary, and the storyboard and motion checklists |
| `references/kit.md` | The building blocks: engine, cast, sets, room kit, light, UI, looks, and how to add each |
| `references/sound.md` | Writing sound events, prompts, levels, costs |
| `references/cast.md` | The StickMan Academy cast: each character's colour, prop and comic role |
| `references/traps.md` | Everything that cost time on the two example episodes |
| `studio/` | The Remotion project: copy it once, then every episode lives in it |
| `scripts/` | voice, plan, castcheck, stills, board, sfx, mixcheck, motiongrid, master, framesheet, run (Python 3.9+ and Node) |
| `agents/` | Six subagents on cheaper models (runner, board check, motion check, fact check, mix fix, shots) |
| `.github/workflows/render.yml`, `scripts/cloud.py` | Render and master an episode on GitHub's servers |

## Rules

- **Original characters only.** Pip (the hero, look B) and Mo (his friend) are ours, and so are the sister, mum and
  the suit on the rig. Never a channel's own hero, and nothing that resembles a famous cartoon character: check every
  new look on the cast sheet (Mo's first hat was dropped for drifting toward one).
- **Original stories.** The formula is shared; the episode isn't anyone else's. Don't remake a channel's title.
- **Never claim the viral channels are made with Claude** or any other tool. Nobody has said how they're made.
- **Keys by name only.** `ELEVENLABS_API_KEY`, from the environment or a `.env`
  above the studio. Never print, paste or hardcode a key.
- **Report the ElevenLabs credits** of every run: the scripts log them to `out/<slug>/costs.json` and `master.py`
  totals them in `report.json`. The voice's cost is read from the account's history (exact); sound clips don't show
  there, so their cost comes from the account counter, which can lag: re-read it before you report. Say the number
  when you hand the episode over. The copy-paste run cost 152 credits (78 for the voice, 74 for 12 new clips).
- **Two characters per shot, at most.** No frame shows more than two figures at once: rig characters, Robo, and the
  extras a set draws by itself (the classroom's seated kids: pass `kids={false}`) all count, even tiny, blurred or
  half off-frame. A scene with more people is cut as a sequence of one- and two-shots. `castcheck.mjs` enforces it
  (step 4) and nothing renders until it passes.
- **Character accuracy before anything else.** Every character on screen is the right look from `LOOKS`, at the
  right scale (Titan-0 about 1.25, the sister about 0.7), with the whole head, hair and hat inside the frame, the
  right name in the script and on screen (one spelling: `references/cast.md`), and acting in their own role. A shot
  that gets a character wrong fails, however good the rest is.
- **Storyboard before animation.** No video render until the stills pass the self-check (step 5) and, when the person
  is in the loop, they've seen the board.
- **Every fact is real.** A number in the script is worked out and sourced in the episode's `science` field first.

## Setup (once per machine)

Needs Node 18+, ffmpeg and ffprobe on the PATH, Python 3.9+ with `numpy` and `Pillow`, and an ElevenLabs key.

```bash
cp -r <skill>/studio ./what-if-studio && cd what-if-studio && npm install
mkdir -p ../.claude/agents && cp <skill>/agents/*.md ../.claude/agents/
```

The second line installs the six subagents for the project (Claude Code reads `.claude/agents/` at the start of a
session; restart it once).

Everything below runs from that studio folder; `<skill>` is this skill's folder. To work offline or in your own
brand face, put a display font in `public/fonts/` and set `titleFont` in `src/studio.config.ts` (the default title
face, Bricolage Grotesque, and the UI faces load from Google Fonts at render time). To update an existing studio to
a newer engine, copy `<skill>/studio/src/engine` over its `src/engine`.

## Working lean: agents and models

The main conversation (the strongest model) makes the creative calls: the script, the shot design, what to fix.
Everything mechanical or long-winded goes to a subagent on a cheaper model, which returns a few lines instead of a
log, a folder of stills or a page of numbers. Install them once (step "Setup"), then:

| Agent | Model | Use it for | Steps |
|---|---|---|---|
| `wi-runner` | haiku | every script run (plan, castcheck, stills, board, sfx, mixcheck, motiongrid, master, framesheet): it calls `run.py`, keeps logs out of the conversation, retries a browser that misses its launch | 2-8 |
| `wi-fact-check` | sonnet | the science: claim vs source, the citation character by character, numbers on screen | 1, 8 |
| `wi-board-check` | sonnet | the stills or the rendered frames against the checklist, characters first, the two-figure rule | 5, 8 |
| `wi-motion-check` | sonnet | the motion grids | 6 |
| `wi-mix-fix` | sonnet | mixcheck to words to events, moves hits, re-mixes (never spends credits) | 7 |
| `wi-shots` | sonnet | one part of a long episode's shots, in its own file, in parallel with the others | 4 |

Habits that save the most tokens:
- **Never read a raw log.** Run scripts through `run.py` (or `wi-runner`): it prints 25 lines at most and keeps the
  rest in `out/<slug>/logs/`. Read the log only when a step fails, and then only its tail.
- **Look at sheets, not folders.** `storyboard.jpg` for stills, `frames-sheet.jpg` (`framesheet.py`) for the
  video, one motion grid per shot. Open a single still only to confirm a suspected fault.
- **Check before you render.** `castcheck.mjs` and `tsc` take seconds; a stills pass takes minutes and a full
  render ten or more. Re-render only the shots you changed (`stills.mjs <slug> S3 S7`).
- **Read only the reference a step needs** (formula.md for the script, kit.md for the shots, sound.md for the mix).
- **Run checks in parallel.** The fact check can run while the voice is recorded; the board check while you start
  on the sound plan. Give each agent its slug and studio path in one sentence; it knows the rest.
- **Long episodes in parts.** Over about 12 shots: write the shared helpers in `src/episodes/<slug>/common.tsx`,
  give each `wi-shots` agent a range of ids and its own file (`shots-a.tsx`, `shots-b.tsx`), and make `shots.tsx`
  re-export them (`export * from './shots-a';`). Two agents never write the same file.

## The pipeline

Work through the steps in order. Each ends on something you look at before the next.

### 1. Script

Read `references/formula.md`. Search YouTube for the premise first: if a What If channel already has that exact
episode, change the power or the rule. From the topic line, decide the power's word, its rule, three escalating
demos and the turn (one real fact with a number). Write `src/episodes/<slug>/episode.json` with `id` (PascalCase,
the composition name), `slug`, `topic`, `title` (two lines), `script` (one entry per beat) and `science` (each fact:
the claim, the working, the source). 45 to 65 words. Read it aloud at pace: every line must be a picture.

### 2. Voice

```bash
python <skill>/scripts/voice.py <slug>
```

One ElevenLabs take with character timestamps (the 356-character copy-paste take cost 78 credits), then the pauses
cut to the genre's pace: `public/<slug>/voice.wav` and `src/episodes/<slug>/words.json`. Check the length (15-25 s)
and the word times it prints. Retune pauses with `gaps` in `episode.json` and re-run: the take is cached, so that's free. Change a word
and it calls the API again.

### 3. Shot list

Design one shot per picture in the script (usually 9 to 14), varying the size and angle every cut (wide, insert,
medium, close-up, over the shoulder, high, low; see `references/look.md`). Add to `episode.json`:

- `shots`: `{ "id": "S1", "size": "medium", "set": "kitchen", "key": 14, "note": "what we see" }` (`key` is the
  frame of the shot's own clock the storyboard shows)
- `edit`: `{ "shot": "S1", "at": "cookie" }` per cut, cued on the word it lands on (`plan.py` lists the cue forms;
  `reverse`, `from`, `to` and `look` for powers that bend a shot's clock)
- `fx`: one-frame flashes and shakes, `{ "at": "S3+2", "kind": "flash" }`

```bash
python <skill>/scripts/plan.py <slug>
```

It writes `timeline.json` and `out/<slug>/shotlist.md` and prints the pace. Aim for 27+ cuts a minute in the
opening and no static shot over about 3 s; fix what it flags before drawing anything.

### 4. Storyboard

Read `references/kit.md` for the building blocks. Write `src/episodes/<slug>/shots.tsx`, one component per shot,
each a pure function of its clock `t` (copy the patterns in the two examples' `shots.tsx`), and `index.tsx` (the
episode and its power look), then add the episode to `src/episodes/index.ts`. At this step each shot only needs to
be right at its `key` frame. When a topic needs a place the library lacks, build it with the room kit and add it to
`src/engine/sets/` (and to the skill's copy) so the next episode has it, as the copy-paste run did with the kitchen
and the schematic. A new character or costume: add the look, then check it on the cast sheet
(`npx remotion still src/index.ts Cast out/cast.png`).

```bash
npx tsc --noEmit
node <skill>/scripts/castcheck.mjs <slug>
node <skill>/scripts/stills.mjs <slug>
python <skill>/scripts/board.py <slug>
```

`castcheck.mjs` draws every shot at its start, key frame, middle and end (no browser, a second or two) and lists the
shots with more than two figures on screen, naming who. Fix those first: split the shot, move a character out, or
empty the set (`<Classroom kids={false} />`).

`out/<slug>/storyboard.jpg`: one captioned still per shot.

### 5. Self-check the stills

Look at the storyboard, then open every still in `out/<slug>/board/` at full size, and run the storyboard checklist
in `references/look.md` honestly, shot by shot. Write down what fails, fix it, re-render just those shots
(`stills.mjs <slug> S3 S7`), rebuild the sheet and look again. Repeat until it passes. Check `references/traps.md`
for the failure you're seeing before inventing a fix. If the person is in the loop, show them the board now and
take their notes before animating.

### 6. Animate

Bring each shot to life from its key pose: `poseAt` keys with anticipation, holds and overshoot, `faceAt` for
expressions, camera moves with `kf`, the power's look, the `fx`. Then render a draft and check the motion:

```bash
python <skill>/scripts/master.py <slug>
python <skill>/scripts/motiongrid.py <slug> S2 S5
node <skill>/scripts/stills.mjs <slug> --frames 120 240
```

Read the grids like a flipbook against the motion checklist in `references/look.md`; fix and re-render until it
reads.

### 7. Sound

Read `references/sound.md`. Add `sound` to `episode.json`: the clips (prompt and length), one event per visible
action cued to its shot, ambiences per location, the music bed and the levels. Check what the library already has,
then generate:

```bash
python <skill>/scripts/sfx.py <slug> --dry
python <skill>/scripts/sfx.py <slug>
```

It prints the credits it used and sets the stem volumes in `timeline.json`. Then check that every word stays clear:

```bash
python <skill>/scripts/mixcheck.py <slug>
```

It lists the moments, while a word is being spoken, where effects or music come within 3 dB of the voice. A hit that
illustrates a word lands in the pause just after it, never on it; a bed (a hum, a drone) under a key line comes down;
if most of the stem crowds the voice, lower `sfx_lu`. Re-run sfx.py and the check until only deliberate overlaps
remain (a title boom, a turn).

### 8. Master and hand over

```bash
python <skill>/scripts/master.py <slug>
python <skill>/scripts/framesheet.py <slug>
```

Or on GitHub's servers instead of this machine: `python <skill>/scripts/cloud.py <slug>` (see "Render in the cloud"
below).

Renders, brings the mix to -14 LUFS with peaks under -1 dBTP, and writes `out/<slug>/report.json` (length, loudness,
pace, credits). Watch the final file once through with sound. Hand over `out/<slug>/<slug>-final.mp4` and
`out/<slug>/storyboard.jpg`, with the length, the ElevenLabs credits used, and anything you'd still improve.

## Render in the cloud (GitHub Actions)

When this skill lives in your own GitHub repository, the render and the master can run on GitHub's machines: no
local Chrome timeouts, and the computer stays free. From the studio folder, after the sound step:

```bash
python <skill>/scripts/cloud.py <slug>
```

It copies the episode (`src/episodes/<slug>/` and `public/<slug>/`) into the repository's `cloud/<slug>/`, commits
and pushes it, starts the `render` workflow, waits for it, and downloads `<slug>-final.mp4`, `report.json` and the
frame sheet into `out/<slug>/cloud/`. Needs the GitHub CLI signed in (`gh auth login`). The voice and sound are
already made locally, so the cloud run spends no ElevenLabs credits. Engine changes travel with the repository: push
them before rendering an episode that needs them.

## Where an episode lives

| Path | What |
|---|---|
| `src/episodes/<slug>/episode.json` | Everything you write: script, science, shots, edit, fx, sound |
| `src/episodes/<slug>/shots.tsx`, `index.tsx` | The drawing: one component per shot, the power's look |
| `src/episodes/<slug>/words.json`, `timeline.json` | Written by voice.py and plan.py (sfx.py adds the volumes) |
| `public/<slug>/` | voice.wav, sfx.wav, music.wav |
| `out/<slug>/` | board stills, storyboard.jpg, shotlist.md, motion grids, renders, costs.json, report.json |
| `library/sfx/` | Every generated sound clip, shared by all episodes |
