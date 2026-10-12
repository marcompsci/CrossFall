# Game Center setup (App Store Connect)

The app already signs players in to Game Center, submits scores and reports achievements.
These IDs must exist in App Store Connect before the Ranks tab can show worldwide rankings.
Until they exist, the Ranks tab says the leaderboards are being set up; scores still save on the phone.

Open **App Store Connect › Apps › Crossfall › Services › Game Center** (on newer layouts: **Distribution › Game Center**),
turn Game Center on for the app version, then add:

## Leaderboards

| Reference name | Leaderboard ID | Type | Score format | Sort | Notes |
| --- | --- | --- | --- | --- | --- |
| All-time total | `crossfall.total` | Classic | Integer | High to low | Lifetime total score. Submission type: Best score. |
| Best game | `crossfall.best` | Classic | Integer | High to low | Best single game. Submission type: Best score. |
| This week | `crossfall.weekly` | Recurring | Integer | High to low | Starts on a Monday, duration 1 week, repeats. Best game of the week. |

For each one, add an English localisation: display name ("All-Time Total", "Best Game", "This Week") and score format suffix "points".

## Achievements

| Reference name | Achievement ID | Points | Shown before earned? | Description |
| --- | --- | --- | --- | --- |
| First Finish | `crossfall.first_finish` | 10 | Yes | Finish your first puzzle. |
| On the Line | `crossfall.first_target` | 15 | Yes | Build a target word on the middle line. |
| Three Stars | `crossfall.three_stars` | 20 | Yes | Earn all three stars on a puzzle. |
| Rush Master | `crossfall.rush_ten` | 30 | Yes | Win 10 rushes (progress shows as you go). |
| Every Category | `crossfall.every_category` | 25 | Yes | Play a puzzle in every category. |

Each achievement needs an English localisation (title, description before/after earning) and a 512×512 or 1024×1024 image.
Images are in `design/achievements/`.

## Testing

Game Center works in TestFlight and development builds with the sandbox environment. Sign in on the iPhone under
**Settings › Game Center**, then open Crossfall: a "Welcome back" banner appears, and the Ranks tab loads the boards.
