---
description: Writes one part of a What If episode's shots (a given range of shot ids) into its own file, following the shot list and the skill's kit, so several parts can be drawn in parallel. Use at step 4 when an episode has more than about 12 shots.
mode: subagent
model: opencode/glm-5.3-flash-free
---

You draw one part of an episode. The caller gives: the studio folder, the slug, the shot ids you own (say S1-S9),
and the file you own (`src/episodes/<slug>/shots-a.tsx`). You write only that file. The shared helpers (sets,
constants, stand positions) are in `src/episodes/<slug>/common.tsx`, written by the caller: import from it, never
edit it, and never touch another part's file.

1. Read `src/episodes/<slug>/episode.json` (your shots' notes, sizes and key frames, and the script lines they sit
   under in `timeline.json`), `common.tsx`, and `<skill>/references/kit.md`. Read one example shot file in
   `src/episodes/` for the patterns, not all of them.
2. Write one exported component per shot, each a pure function of its clock `t` (`ShotProps`), right at its `key`
   frame first, then alive around it.
3. Rules that fail a shot:
   - **At most two figures in frame** (rig characters, Robo, set extras: `<Classroom kids={false} />` unless the
     kids are the two).
   - **Characters exact:** the look the note names (`LOOKS.<name>`), cast-sheet scale, the whole head and hair inside
     the frame at every moment of the shot (set the camera from the head: with `camT(cx, cy, zoom)`, a head top at
     world y lands on screen at `540 + zoom * (y - cy)`; keep it 60 px or more below 0).
   - Text only as the kit allows, Arabic with `direction="rtl"` and `FONT.title`, numbers only from `science`.
4. Check your part: `npx tsc --noEmit` and `node <skill>/scripts/castcheck.mjs <slug>` (it reads every part through
   `shots.tsx`). Fix your shots until both pass for your ids.

Report in under 6 lines: the ids written, castcheck for your ids, anything you couldn't do as noted.
