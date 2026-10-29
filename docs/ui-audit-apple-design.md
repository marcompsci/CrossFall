# Crossfall UI audit — Apple design / fluid interfaces

_28 October 2026 · measured against Emil Kowalski's `apple-design` skill (github.com/emilkowalski/skills), which distils Apple's WWDC "Designing Fluid Interfaces" talk for the web._

Goal: the app should feel built by hand, not generated. The biggest tells were sameness (one title formula on every screen, a bordered card around everything, wide-tracked caps labels), bouncy motion with no physical cause, and screens that popped in and out with no path.

## Findings and fixes

| # | Principle (skill §) | What was there | Fix | Verified |
|---|---|---|---|---|
| 1 | Response: acknowledge on press (§1, §10) | Only the keypad and one tile had a pressed state. Every other button changed nothing until release. | Every button, summary and link scales to 0.97 in 80 ms on press; `.big` also darkens. `touch-action: manipulation` on all controls removes the double-tap delay. Keypad keys keep firing on `pointerdown`. | `t9.py`, visual check |
| 2 | Spatial consistency: enter and exit along the same path (§7); interruptibility (§3) | 22 full-screen sheets appeared and vanished instantly, with no sense of where they came from. | Sheets rise 14 px and fade in; on close they leave the same way. Uses CSS transitions (`@starting-style`, `transition-behavior: allow-discrete`), which retarget from the live value, so a sheet reopened mid-close reverses smoothly. A closing sheet ignores taps. Older iOS just shows/hides as before. | `t9.py` (opacity mid-enter, display + `pointer-events:none` mid-exit) |
| 3 | Behaviour over animation; no overshoot without momentum (§4) | ~10 overshoot curves (`cubic-bezier(…,1.4–1.6,…)`) on chrome: celebration cards scaling from 0.6, XP pops, the tab indicator, the lens. | Chrome uses one critically damped curve (`cubic-bezier(.2,.8,.2,1)`), smaller scale changes (0.94 → 1). The falling letter tiles and in-well combo callouts keep their bounce, because that motion has a physical cause. | Visual check |
| 4 | Hint in the direction of travel (§7, §8) | Hub tabs always slid in from the right, even when moving left. | `goPage` sets `--dir`; pages slide in from the side you're heading toward. | `t9.py` |
| 5 | Direct manipulation, velocity, momentum, rubber-banding (§2, §5, §6, §9) | The menu drawer could only be closed by tapping ✕ or the scrim. | Drag the drawer closed: 1:1 tracking with Pointer Events + capture after a 10 px horizontal threshold (vertical drags still scroll), release velocity projected (`d = 0.998`) to decide close vs. snap back, settle duration matched to the finger's speed, rubber-band resistance past the open edge, a light haptic on close, and no accidental menu tap after a drag. | `t9.py` (flick closes, slow drag returns, rubber band, vertical ignored, no stray tap) |
| 6 | Reduced motion / transparency / contrast (§14) | Reduced motion was handled; reduced transparency and increased contrast weren't. The in-app Calm setting didn't cover new motion. | `prefers-reduced-transparency` drops blur and uses solid bars. `prefers-contrast: more` gives cards and buttons solid outlines. Calm and Reduce Motion turn sheet motion into a plain cross-fade and remove press scaling. | CSS review |
| 7 | Typography: tracking by size, hierarchy from weight + size (§15) | Every screen title was the same template: 44 px caps with the second word, or half a word ("ACHIEVE**MENTS**", "SET**TINGS**"), in orange. Small labels were tracked up to 0.14 em. | Titles are one colour at 36 px with slight negative tracking. The orange accent stays where it means something: the CROSSFALL wordmark and the result screen ("WELL **DONE**"). Small labels sit at 0.05 em (0.08 em for the two tiny all-caps ones). | `t9.py` + screenshots |
| 8 | Materials and depth: separate by fill, not hard dividers (§12) | 64 hard 1px outlines; every panel was a bordered box. | Panels are borderless surfaces with a soft inner highlight and shadow (a warm drop shadow in light mode). Borders stay on tappable rows and in high-contrast mode. | Screenshots, axe |
| 9 | Craft (§16) | A second `@keyframes pop` (for XP) silently replaced the toast's `pop`, so game toasts ("ROW CLEAR +100") started off-centre. "Surprise me" ran into its subtitle. | XP uses its own `xpgpop`; the duplicate is gone. Tile subtitles sit on their own line. | `t9.py` checks one `pop` exists and it's the centred one |

## Also fixed while checking content

- **Harvest Season repeated the existing packs.** 15 of its words were already in October's "Harvest Moon" pack and 7 in November's "Gratitude". Two targets (LEAF, CROP) used letters none of their words contained, so 3 stars was impossible. The six puzzles are now Farm Stand, Woodland Walk, County Fair, Cozy Kitchen, Knit Night and Moonlit Fields: 3 shared words left, every target buildable, all six build.

## Not changed (deliberately)

- **Fonts.** The skill prefers the system font, but Bungee, Martian Mono and Atkinson Hyperlegible are Crossfall's identity, and Atkinson is chosen for readability.
- **Tile bounce and combo callouts** in the well: they are game feedback with a cause.
- **The card deck** already uses native scroll snapping, which carries real momentum.

## Tests

`t9.py` 13/13 (drawer gestures, sheet enter/exit, keyframes, tab direction, titles), `t8.py` 47/47, axe clean on all new screens once motion settles, daily puzzles unchanged, release gate 34/34.
