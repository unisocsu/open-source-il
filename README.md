# קוד פתוח ישראל 🇮🇱

קטלוג קהילתי בעברית לפרויקטים בקוד פתוח. האתר והאפליקציות החיצוניות משתמשים באותו JSON API.

## ארכיטקטורה

- **Frontend:** אתר סטטי RTL, מיועד לפריסה ב-Cloudflare Pages.
- **API:** Cloudflare Worker ב-JavaScript Modules, תחת `/api/v1`.
- **Database:** Cloudflare D1 (SQLite).
- **Source metadata:** GitHub REST API; קישורי הורדה מפנים ישירות ל-GitHub Releases.
- **Public API:** קריאות GET ציבוריות ללא מפתח API. פעולות כתיבה ידרשו התחברות והרשאות.

## מבנה

```
frontend/       אתר סטטי (Cloudflare Pages)
worker/         Cloudflare Worker API
database/       סכימת D1 ונתוני בסיס
api/            OpenAPI 3.1 ודוגמאות
.github/        תהליכי CI ופריסה
```

## פיתוח מקומי

דרישות: Node.js 20+ ו-Wrangler.

1. התקנת תלויות: `cd worker && npm install`
2. יצירת D1 מקומי והרצת הסכימה: `npx wrangler d1 execute open-source-il-db --local --file=../database/schema.sql`
3. הרצת ה-API: `npm run dev`
4. פתיחת האתר: הגשת תיקיית `frontend` באמצעות שרת סטטי.

ה-Worker מוגדר עם binding בשם `DB`. לפריסה אמיתית יש ליצור D1 ב-Cloudflare ולעדכן את `database_id` ב-`worker/wrangler.toml`.

## API

Base path: `/api/v1`

- `GET /health`
- `GET /projects?limit=20&offset=0&category=...`
- `GET /projects/:id`
- `GET /categories`
- `GET /search?q=...`
- `GET /users/:id`
- `GET /releases/:id`

תיעוד מלא: [api/openapi.yaml](api/openapi.yaml).

## פריסה

האתר נפרס ל-Cloudflare Pages מתוך `frontend/`; ה-API נפרס בנפרד כ-Worker מתוך `worker/`. יש להגדיר ב-GitHub Secrets את `CLOUDFLARE_API_TOKEN` ואת `CLOUDFLARE_ACCOUNT_ID`, וב-Worker להגדיר את `ALLOWED_ORIGINS` לדומיין ה-Pages.

## סטטוס

זהו שלד ראשוני: API לקריאה, סכימת נתונים, אתר בסיסי ותשתית CI. OAuth, כתיבה מאומתת, מודרציה ומערכת מוניטין יתווספו בשלבים הבאים לפני פתיחת הגשות ציבוריות.
