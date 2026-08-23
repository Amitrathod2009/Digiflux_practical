# API Contract — Molt Coach mock server

Base URL: `http://localhost:4000` (Android emulator: `http://10.0.2.2:4000`)

Run it: `node server.js` — Node 18+, no dependencies, no install.

---

## Units — read this before you write any code

| Thing  | Stored on the server | Shown in the UI            |
| ------ | -------------------- | -------------------------- |
| Weight | **kilograms** (`weightKg`) | kg or lb — user toggles |
| Girth  | **millimetres** (`valueMm`) | cm or inch — user toggles |

The server never sends or accepts anything else. Conversion is a display concern
and belongs in one pure function on the client.

`1012 mm` → `101.2 cm` → `39.84 in`
`86.0 kg` → `189.60 lb`

---

## Behaviour you must design around

| Behaviour | Detail |
| --- | --- |
| Latency | 400–1200 ms on every call |
| Read failures | ~10% of GETs return `503` |
| Write failures | ~15% of POSTs and DELETEs return `503` |
| Ordering | **Lists come back in random order.** Sort on the client. |
| Auth | Every endpoint except `/auth/login` needs `Authorization: Bearer <token>` |
| Expiry | An invalid or missing token returns `401` |

---

## Error shape

Every error uses the same body, so you only have to type it once.

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "field": "weightKg",
    "message": "Weight must be between 20 and 400 kg."
  }
}
```

`field` is only present on `422`.

| Status | `code` | When |
| --- | --- | --- |
| 401 | `INVALID_CREDENTIALS` | wrong email or password on login |
| 401 | `UNAUTHORIZED` | missing or bad token on any other call |
| 404 | `NOT_FOUND` | unknown client id or entry id |
| 422 | `VALIDATION_FAILED` | bad input — `field` says which one |
| 422 | `DUPLICATE_DATE` | that client already has an entry on that day |
| 503 | `SERVICE_UNAVAILABLE` | the random failure |

---

## Endpoints

### `POST /auth/login`

```json
// request
{ "email": "coach@molt.app", "password": "molt1234" }

// 200
{
  "token": "molt_test_token_9f3a",
  "coach": {
    "id": "coach_1",
    "name": "Priya Menon",
    "email": "coach@molt.app",
    "role": "coach",
    "gymName": "Molt Strength Studio",
    "clientCount": 5
  }
}
```

Email is matched case-insensitively and trimmed. Password is not.
Missing email or password → `422`. Wrong credentials → `401`.

### `GET /me`

Returns the coach object. Useful for the Profile tab.

### `GET /clients`

```json
{
  "items": [
    {
      "id": "c1",
      "name": "Aarav Shah",
      "goal": "fat_loss",
      "startDateISO": "2026-03-31T09:00:00.000Z",
      "heightCm": 178,
      "avatarColor": "#3B82F6"
    }
  ]
}
```

`goal` is one of `fat_loss` | `muscle_gain` | `maintenance` | `recomp`.
**Order is randomised on every call.**

### `GET /clients/:clientId`

Returns one client object, or `404`.

### `GET /clients/:clientId/weight`

Query params — all optional:

| Param | Example | Meaning |
| --- | --- | --- |
| `from` | `2026-06-29T00:00:00.000Z` | only entries on or after this |
| `to`   | `2026-07-29T00:00:00.000Z` | only entries on or before this |

```json
{
  "items": [
    {
      "id": "w_1013",
      "clientId": "c1",
      "dateISO": "2026-07-25T09:00:00.000Z",
      "weightKg": 86.5,
      "note": null,
      "source": "coach"
    }
  ]
}
```

For the `30D` filter, send `from` = now minus 30 days. Empty `items` is a valid,
successful response — it is not an error.

### `POST /clients/:clientId/weight`

```json
// request
{ "dateISO": "2026-07-29T09:00:00.000Z", "weightKg": 85.4, "note": "Morning" }
```

`201` returns the created entry, including a server-assigned `id`, a
`createdAtISO`, and `weightKg` **rounded to 3 decimals by the server**. Your
optimistic row must be replaced by this object, not kept alongside it.

Rejections:

| Cause | Status | `field` |
| --- | --- | --- |
| `weightKg` missing or not a number | 422 | `weightKg` |
| `weightKg` < 20 or > 400 | 422 | `weightKg` |
| `dateISO` missing or unparseable | 422 | `dateISO` |
| `dateISO` in the future | 422 | `dateISO` |
| an entry already exists for that client on that calendar day | 422 | `dateISO` (`DUPLICATE_DATE`) |

### `DELETE /weight/:entryId`

`204` on success, `404` if it is already gone.

### `GET /clients/:clientId/girth`

Same `from` / `to` params, plus:

| Param | Example |
| --- | --- |
| `site` | `waist` |

Sites: `waist` `chest` `hip` `arm` `thigh`.

```json
{
  "items": [
    {
      "id": "g_1027",
      "clientId": "c1",
      "dateISO": "2026-07-25T09:00:00.000Z",
      "site": "waist",
      "valueMm": 946,
      "source": "coach"
    }
  ]
}
```

Not every client has data for every site. That is normal.

### `POST /clients/:clientId/girth`

```json
{ "dateISO": "2026-07-29T09:00:00.000Z", "site": "waist", "valueMm": 946 }
```

`valueMm` must be `100`–`2000` and is rounded to a whole number by the server.
`site` outside the list → `422`.

### `DELETE /girth/:entryId`

`204` on success, `404` if it is already gone.

---

## Devtools — controlling the chaos

`POST /__devtools` needs **no token**, has **no latency**, and **never fails**.
Use it while developing, and be ready to use it during the review call.

```json
{
  "readFailureRate": 0,
  "writeFailureRate": 1,
  "minLatencyMs": 0,
  "maxLatencyMs": 50,
  "offline": false,
  "reset": true
}
```

Every field is optional; send only what you want to change.

| Field | Effect |
| --- | --- |
| `readFailureRate` | `0` = never fail reads, `1` = always fail reads |
| `writeFailureRate` | same, for writes |
| `minLatencyMs` / `maxLatencyMs` | speed the server up or slow it down |
| `offline` | `true` = the server drops connections, like no network |
| `reset` | `true` = wipe everything you added, back to the seed data |

Useful during development:

```bash
# make it fast and reliable while you build the UI
curl -X POST http://localhost:4000/__devtools \
  -H 'Content-Type: application/json' \
  -d '{"readFailureRate":0,"writeFailureRate":0,"minLatencyMs":0,"maxLatencyMs":50}'

# then turn the chaos back on before you record your video
curl -X POST http://localhost:4000/__devtools \
  -H 'Content-Type: application/json' \
  -d '{"readFailureRate":0.1,"writeFailureRate":0.15,"minLatencyMs":400,"maxLatencyMs":1200}'
```

Building against the fast settings and never testing against the slow ones is
the mistake we see most often.

---

## The sample data

Five clients. They are not all the same on purpose.

| Client | id | What you will find |
| --- | --- | --- |
| Aarav Shah | `c1` | ~90 days of weight, girth for four sites |
| Meera Iyer | `c2` | one single weight entry, no girth |
| Rohan Desai | `c3` | nothing at all |
| Sana Qureshi | `c4` | short history, and it is messy |
| Vikram Nair | `c5` | plenty of history, none of it recent |

There are a few more edge cases in the data that are not listed here. Look at
`db.json` before you start building — twenty minutes reading the data will save
you two hours of rework.
