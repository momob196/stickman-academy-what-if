# StickMan Academy: the cast bible

The channel's own cast. Each character is built so a viewer knows them in a split second: **one colour, one fixed
prop** (their Character DNA), and **one comic engine** that writes scenes on its own. Keep every one of them on the
rig in `rig.tsx` (looks in `LOOKS`, order in `ACADEMY` and `ACADEMY_NEW`); render them with
`npx remotion still src/index.ts Cast out/cast.png`, the poses with `CastPoses`.

| Character | Code | DNA: colour + prop | Role and comic engine |
|---|---|---|---|
| **StickMan** (ستيكي مان) | `stickman` | red: cape, scarf, energy gloves | **The eager optimist.** Jumps to the fix before he understands the problem, and learns from the disaster in front of everyone. The hero. |
| **Dr. Zed** (الدكتور زيد) | `zed` + `<ZedHolo>` | white coat, round specs, a holo screen of equations over his head | **The over-complicated genius.** Turns an everyday problem (opening a stuck door) into cosmic physics. Comedy of scientific overkill. |
| **ProMax** (بروماكس) | `promax` + `<Drone>` | black and gold armour, shades, a drone at his shoulder | **The show-off rival.** Relies entirely on expensive tech, which always fails at the crucial moment (`Drone fail`), so he has to use his head. |
| **Lina** (لينا) | `lina` | pink: scarf, boots, the energy chevron | **The strategist.** The only one with a sensible plan; the dry voice of reason against the team's madness. The viewer sides with her at once. |
| **Shadow** (الظل) | `shadow` | violet: glowing eyes, the aura round his cloak | **The mysterious anti-hero.** Says almost nothing. Hides in the background of every episode (an Easter egg), then steps in at the last moment. |
| **Timo** (تيمو) | `timo` | green: cap and backpack | **Half of the chaos duo.** Asks the strange questions viewers think of ("what if we jumped into a black hole?"). |
| **Robo** (روبو) | `<Robo>` | cyan: visor face, core, the transmitting antenna | **The other half.** Tries to carry Timo's questions out literally. |
| **Master Zen** (المعلم زن) | `zen` | straw hat, beard, the rune-carved staff | **The ironic sage.** Gives wisdom that sounds deep, which the team later finds was about a recipe or a video game. |
| **Glitch** (غليتش) | `glitch` | neon green outline, a screen face (`ERROR 404`), pixels falling off | **The bug.** Born of a failed experiment by Dr. Zed and Robo. Breaks the video's own rules: pauses it, rubs out a wall, breaks the fourth wall to ask the viewer for help. |
| **Echo** (إيكو) | `echo` | cyan: huge glowing headphones, sound rings on her wrists | **Speaks in sound.** Talks only in sound effects and audio stings, which makes her built for Shorts: her moves cut to the beat in the first 3 seconds. |
| **Titan-0** (تايتن زيرو) | `titan` | metal grey, one orange camera eye, a tiny coffee cup | **The lazy guard.** Enforces the rules but wants to finish his break. Huge power against huge laziness, so students sneak past him. Draw him at about 1.25 of the others' scale; his eye lid drops for `tired`. |
| **Chronos** (كرونوس) | `chronos` | copper coat, a glowing hourglass, floating silver hair | **The exchange student from another time.** Hosts the history, science and "What if?" episodes: takes the students on quick trips through time to crack a puzzle. |

## Using them in a What If episode

- **Two on screen at most.** However many of the cast an episode uses, no frame shows more than two of them (set
  extras count too). Cut a group moment as a sequence of one- and two-shots; `scripts/castcheck.mjs` checks it.
- **One spelling per name**, the one in the table above, in the script and on screen: غليتش, not جليتش.
- The What If formula (`formula.md`) still runs the episode: 15 to 25 seconds, seven beats, one real fact. The cast
  only decides **who** carries each beat. A good default: Chronos or Timo asks the question, StickMan tries the power,
  Dr. Zed delivers the real fact, Glitch or ProMax's failing tech makes the turn, Lina's line lands the ending.
- Keep each character to their engine. If a scene needs someone to be sensible, it's Lina; if it needs a gadget to
  fail, it's ProMax; never swap them.
- Hide Shadow somewhere in the background of every episode.
- Light them on the Academy set with `rimId="rimSun"`. On the dusk sets the default rim works, but check the dark
  characters (Shadow, Titan-0, Glitch) on the cast sheet first.

## The pilot idea (from the brief)

"The impossible entrance exam (Glitch broke the system)": Master Zen puts a big red button in the middle of the hall:
"to pass, don't touch this button for 60 seconds". In second 4 StickMan leaps to stop Timo touching it, they crash
into ProMax, and the chain of chaos begins. As a What If short it fits the formula once the turn carries a real fact.
