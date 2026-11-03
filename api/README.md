# שימוש ב-JSON API

כל לקוח — אתר, אפליקציית Android, תוכנת Windows או בוט — יכול לקרוא את אותו API.

## כתובת בסיס

לאחר פריסת ה-Worker, החליפו את כתובת הדוגמה בכתובת האמיתית:

```
https://open-source-il-api.YOUR-SUBDOMAIN.workers.dev/api/v1
```

## דוגמאות

```bash
# בדיקת שרת
curl https://YOUR-WORKER.workers.dev/api/v1/health

# רשימת פרויקטים
curl "https://YOUR-WORKER.workers.dev/api/v1/projects?limit=20&offset=0"

# סינון לפי קטגוריה
curl "https://YOUR-WORKER.workers.dev/api/v1/projects?category=android"

# חיפוש
curl "https://YOUR-WORKER.workers.dev/api/v1/search?q=editor"

# פרטי פרויקט
curl https://YOUR-WORKER.workers.dev/api/v1/projects/PROJECT_ID
```

## מבנה תשובה

הצלחות מוחזרות במבנה `{ "success": true, "data": ... }`. שגיאות מוחזרות במבנה `{ "success": false, "error": { "code": "...", "message": "..." } }`.

## מדיניות גישה

- קריאות GET למידע ציבורי אינן דורשות API key.
- פעולות שינוי מידע ידרשו התחברות והרשאות; אין לשלוח סודות או OAuth client secrets באפליקציות לקוח.
- `github_stars` הוא מספר הכוכבים ב-GitHub; `community_votes` הוא דירוג הקהילה. אלו מדדים נפרדים.
- קישורי נכסי Release מפנים ישירות ל-GitHub.
- יש לכבד pagination ולהימנע משליחת בקשות תכופות ללא צורך.

המפרט המחייב נמצא ב-[openapi.yaml](openapi.yaml).
