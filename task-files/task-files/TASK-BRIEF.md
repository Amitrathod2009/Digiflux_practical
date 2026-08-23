# Practical Task — Mobile Application Developer (React Native)

**Time:** 4–5 hours of focused work. Please do not spend more.
**Deadline:** submit within 3 days of receiving this.
**Stack:** React Native CLI (not Expo), TypeScript.

---

## Read this part first

Last time we ran this exercise, the main problem was not coding skill. It was
that the task was not understood clearly enough. So this document is long on
purpose. Nothing here is a riddle.

Three things to know before you start:

1. **We are not testing whether you can finish everything.** We are testing how
   you think, how you structure code, and how you handle the ugly parts.
   A smaller app that handles bad data and failed requests well beats a bigger
   app that only works when everything goes right.
2. **The fake server is deliberately hostile.** It is slow. It fails about 10%
   of reads and 15% of writes. It returns lists in random order. It rejects bad
   input. That is not a bug in the server — that is the exercise.
3. **The sample data is deliberately uneven.** Some clients have a lot of data,
   one has a single entry, one has nothing at all, some data is older than every
   filter range. Real coaching data looks exactly like this.

If anything in this document is unclear, **email us and ask**. Asking a good
question is a positive signal, not a negative one.

---

## Priority order — read this before you plan your time

You have 4–5 hours. That is **not** enough to polish everything, and we know it.
Build in this order and stop when the time is up.

| Priority | What | Roughly |
| --- | --- | --- |
| **1. Must have** | Login → token stored → Clients list → Weight list for one client | ~1.5 h |
| **2. Must have** | Add weight (optimistic) + delete (optimistic) + rollback on failure | ~1.5 h |
| **3. Must have** | Loading / error / empty states everywhere, range filter, kg↔lb toggle | ~1 h |
| **4. Should have** | Girth tab (read only), bottom tabs, Profile tab | ~45 min |
| **5. Do not build** | Charts, animations, dark mode, custom design system, offline queue | — |

**If you only finish priorities 1–3, that is a good submission.** Write in your
README what you skipped. We would rather see three screens done properly than
six screens half-done.

### A suggested first 30 minutes

1. `node server.js` in one terminal. Leave it running.
2. Log in from the terminal with `curl` (the exact command is in
   `API-CONTRACT.md`) so you can see a real response before you write any UI.
3. Call `GET /clients` and `GET /clients/c1/weight` the same way. Look at the
   shapes. Notice the ordering and the units.
4. Write your TypeScript types from those real responses.
5. *Then* start the app.

Doing this first is the single biggest difference between a smooth run at this
task and a painful one.

---

## 1. What you are building

A small app for a **fitness coach**. The coach opens the app, sees their list of
clients, taps one, and reviews that client's body-measurement progress. They can
add a new measurement and delete a wrong one.

The app is called **Molt Coach**.

---

## 2. Screens — exactly what we need

### Screen 1 — Login

```
+----------------------------------+
|                                  |
|            Molt Coach            |
|                                  |
|   Email                          |
|   [ coach@molt.app            ]  |
|                                  |
|   Password                       |
|   [ ••••••••                  ]  |
|                                  |
|   [        Sign in           ]   |
|                                  |
|   ! Email or password is wrong.  |
|                                  |
+----------------------------------+
```

Test login: `coach@molt.app` / `molt1234`

Requirements:

- **L1** — Email and password fields. Password is masked.
- **L2** — Sign in button is disabled while a request is in flight, and shows a
  loading state. The user must not be able to fire two logins by double-tapping.
- **L3** — Client-side validation before the call: empty email, empty password,
  and obviously-invalid email format are caught locally with an inline message.
- **L4** — Server errors are shown as readable text, not a raw JSON dump and not
  a `console.log`. Wrong password (`401`) and server down (`503`) must not show
  the same message.
- **L5** — On success, store the token so that **killing and reopening the app
  keeps the user logged in**. Use `@react-native-async-storage/async-storage`.
- **L6** — After login, the user cannot press hardware Back and land on the
  Login screen again.

### Screen 2 — Bottom tabs

After login, the app shows two bottom tabs.

```
+----------------------------------+
|                                  |
|          (tab content)           |
|                                  |
+----------------------------------+
|     Clients      |    Profile    |
+----------------------------------+
```

- **N1** — Use React Navigation. Bottom tab navigator.
- **N2** — The **Clients** tab contains a stack: Clients List → Client Progress.
- **N3** — Auth state decides which navigator is mounted. When logged out, only
  the Login screen exists in the tree. When logged in, only the tabs exist.
  Do not do this by pushing/replacing screens from inside a component.
- **N4** — Navigation params are typed. No `any`, no `as any`.

### Screen 3 — Clients tab → Clients List

```
+----------------------------------+
|  Clients                         |
+----------------------------------+
|  (A)  Aarav Shah                 |
|       Fat loss · started 120d ago|
+----------------------------------+
|  (M)  Meera Iyer                 |
|       Muscle gain · started 9d.. |
+----------------------------------+
|  (R)  Rohan Desai                |
|       Maintenance · started 2d.. |
+----------------------------------+
```

- **C1** — Loads from `GET /clients`. Shows a loading state on first load.
- **C2** — **The server returns clients in random order every time.** Sort them
  in the app so the list does not jump around between refreshes. Sort by name.
- **C3** — Pull to refresh.
- **C4** — If the request fails, show an error state with a Retry button. Do not
  show an empty list and pretend everything is fine.
- **C5** — Tapping a client opens the Client Progress screen for that client.

### Screen 4 — Client Progress

This is the main screen. It has two sub-tabs at the top: **Weight** and **Girth**.

```
+----------------------------------+
|  <   Aarav Shah                  |
+----------------------------------+
|   [ Weight ]      Girth          |   <- sub-tabs
+----------------------------------+
|  7D  | 30D | [90D] | All         |   <- range filter
+----------------------------------+
|                                  |
|   86.0 kg            [ kg | lb ] |   <- latest + unit toggle
|   -6.4 kg since first entry      |
|                                  |
+----------------------------------+
|  28 Jul 2026     86.0 kg   -0.5  |
|  21 Jul 2026     86.5 kg   -0.6  |
|  14 Jul 2026     87.1 kg   -0.3  |
|  ...                             |
+----------------------------------+
|              [ + Add ]           |
+----------------------------------+
```

#### Weight sub-tab

- **P1** — Loads from `GET /clients/:id/weight`.
- **P2** — **The server does not sort.** Sort newest first in the app.
- **P3** — Range filter: `7D`, `30D`, `90D`, `All`. Changing it refetches with
  the `from` query parameter (see API contract). Do not filter a stale local
  array — go back to the server.
- **P4** — Show the **latest** weight big at the top.
- **P5** — Show the **total change** from the oldest entry in the selected range
  to the newest, with a sign (`-6.4 kg` / `+1.2 kg`).
- **P6** — Each row shows the change from the entry before it.
- **P7** — Unit toggle `kg` / `lb`. This is **display only** — the server always
  stores kilograms and you always send kilograms. Switching kg → lb → kg must
  not change the stored number.
- **P8** — Round for display, not for storage. `86.5 kg` not `86.49999999999999`.
- **P9** — **A client with zero entries** must show a proper empty state
  ("No weight logged yet") with the Add button still available.
- **P10** — **A client with exactly one entry** must not crash and must not show
  a fake `0.0` change. There is no "change" from a single point — show `—`.
- **P11** — **A client whose data all falls outside the selected range** is a
  *different* empty state from a client who has no data at all. "Nothing in the
  last 30 days" ≠ "No data yet". Handle both.
- **P12** — **Do not build a chart.** It is out of scope for this task. A working
  list scores far higher with us than a chart. If you add one anyway we will
  read it as poor prioritisation.

#### Girth sub-tab

**This tab is read only.** There is no Add button and no delete here. It exists
to test one thing: reading a list whose units are not the units you display.

Same screen structure as Weight, with three differences:

- **P13** — There is a **site selector**: `waist`, `chest`, `hip`, `arm`,
  `thigh`. Changing site refetches with the `site` parameter.
- **P14** — **The server stores millimetres. You must display centimetres.**
  `1012` from the API is shown as `101.2 cm`. There is no inch toggle here —
  centimetres only. Getting this conversion wrong is the single most common
  mistake on this task, so please read the API contract carefully.
- **P15** — Some clients have data for some sites and not others. Selecting a
  site with no data shows an empty state — not a spinner that never ends, and
  not a crash. (Client `c1` has no `arm` data at all. Try it.)
- **P16** — The same range filter as Weight applies here.

### Screen 5 — Add weight

Opens from the `+ Add` button on the **Weight** tab only. A modal or a bottom
sheet, your choice.

```
+----------------------------------+
|  Add weight                  X   |
+----------------------------------+
|  Date                            |
|  [ 29 Jul 2026              v ]  |
|                                  |
|  Weight (kg)                     |
|  [ 85.4                       ]  |
|                                  |
|  Note (optional)                 |
|  [                            ]  |
|                                  |
|  ! This client already has an    |
|    entry for that day.           |
|                                  |
|  [          Save             ]   |
+----------------------------------+
```

- **A1** — Date picker. Future dates cannot be selected.
- **A2** — Numeric keyboard for the value.
- **A3** — Validate locally before sending: empty value, non-numeric, out of
  range (20–400 kg).
- **A4** — **The server also validates**, and it catches things your client
  cannot — most importantly a duplicate entry on the same day. When the server
  returns `422`, show the server's message next to the correct field. The `422`
  body tells you which field failed. Use it.
- **A5** — **Optimistic update.** The new row appears in the list immediately,
  visually marked as pending (dimmed, or a small spinner on the row).
- **A6** — If the write fails (`503` or `422`), the optimistic row is **removed
  again** and the user sees why. The list must end up exactly as it was before.
- **A7** — When the write succeeds, reconcile with the server response. The
  server assigns the real `id` and may round the value. Your temporary row must
  be replaced by the server's row, not left sitting next to it as a duplicate.
- **A8** — Save is disabled while in flight. Double-tapping Save must not create
  two entries.

### Delete (Weight tab only)

- **D1** — Long-press or swipe a weight row to delete. Confirm first.
- **D2** — Optimistic delete: the row disappears immediately.
- **D3** — If the delete fails, the row comes back in the right position, and
  the user is told.

---

## 3. Error handling — this is the part we look at hardest

- **E1** — Every network call has exactly three visible outcomes: loading,
  loaded, failed. No screen may sit on a spinner forever.
- **E2** — A failed **read** shows a retry affordance.
- **E3** — A failed **write** rolls back and explains itself.
- **E4** — `401` from any call (not just login) logs the user out cleanly and
  returns them to Login.
- **E5** — Turning the server off completely (there is a switch for this — see
  API contract) must produce a sane error, not a white screen or a crash.

---

## 4. Code quality — what we score

- **T1** — TypeScript is real, not decorative. API responses are typed at the
  boundary. `any` and `as` casts need a reason.
- **T2** — Server state and UI state are separated. The selected range, the
  selected unit, and the selected site are UI state. The entries are server
  state. Do not mix them into one blob.
- **T3** — Data-fetching logic is not written inline inside screen components
  five times over. Extract it — a hook, a service layer, React Query, whatever
  you can defend.
- **T4** — Unit conversion (kg↔lb, mm→cm) lives in one place, is pure, and
  is used everywhere. If we find `* 2.20462` in three files, that costs marks.
- **T5** — Folder structure that a second developer could navigate.
- **T6** — At least **one** meaningful test. Test the conversion functions or the
  delta calculation. One good test beats ten snapshot tests.

You may use AI tools (Cursor, Claude Code, Copilot). We use them too. But in the
review round you will be asked to explain and change your own code live, so do
not ship anything you cannot defend.

---

## 5. The backend

Everything you need is in this folder. **No internet, no signup, no API key,
no npm install for the server.**

```
task-files/
  server.js         <- the fake backend. run it with: node server.js
  db.json           <- the data it serves
  generate-db.js    <- regenerates db.json with fresh dates
  API-CONTRACT.md   <- every endpoint, every error shape. READ THIS.
  TASK-BRIEF.md     <- this file
```

Start it:

```bash
cd task-files
node server.js
# -> http://localhost:4000
```

- iOS simulator: `http://localhost:4000`
- Android emulator: `http://10.0.2.2:4000`
- Real device: `http://<your-computer-ip>:4000`

If the dates in the data look stale (you are running this more than a week after
you received it), run `node generate-db.js` and restart the server.

**Do not replace this server with a hosted mock service, and do not hardcode the
JSON into the app.** The failure behaviour is the point of the exercise.

---

## 6. What to submit

1. A **GitHub repo** (public, or private with access for us).
2. A **README.md** in the repo containing:
   - how to run it (commands, in order)
   - what you finished and what you did not
   - **the three decisions you are least sure about, and why you made them**
   - anything you would do differently with two more days
3. A **screen recording** (2–4 minutes) walking through the app, including at
   least one deliberate failure — add an entry while the server is failing
   writes, and show the rollback.
4. Roughly how long you actually spent.

Honest scope-cutting in the README scores better than silently missing things.
If you ran out of time on the Girth tab, say so.

---

## 7. What comes next

After you submit, we book a **review call**. In that call we will:

- ask you to walk us through your folder structure and one decision from item 2
- ask you to make **three small changes live**, in your own code, with us watching

The live changes are not a trap. They are small, and they are the kind of change
that lands in a real sprint. If your code is well structured they take minutes.
That is exactly what we are measuring.

Good luck. Ask questions if you have them.
