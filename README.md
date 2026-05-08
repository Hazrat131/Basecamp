# my basecamp-2

Project management app. Built with Express, Prisma and SQLite.

## What's new in v2

On top of everything from v1 (sign up / log in, projects CRUD, profile, admin panel) this version adds:

- **Members** — the project creator (the project admin) can invite other users to a project by username or email. Members show up on the project page.
- **Attachments** — any project member can upload files (png / jpg / jpeg / gif / webp / pdf / txt, up to 10 MB). Files appear with a coloured format tag on the project page. The uploader or the project admin can delete them.
- **Threads ("let's discuss!")** — only the project admin can create, edit or delete a thread. Members can read all threads.
- **Messages** — any member can post a message into a thread, and edit or delete their own messages. The project admin can edit or delete anyone's message.

## What it does (full list)

- Sign up, log in, log out (passwords hashed with bcrypt)
- Create / edit / delete projects
- Add and remove project members
- Upload, list, download and delete project attachments
- Create discussion threads inside a project
- Post, edit and delete messages inside a thread
- Profile page (own / admin)
- Admin panel: stats, user management (make/remove admin, ban/unban, delete), view all projects
- Validation, error pages, session security

## Running it locally
You need Node.js 18+. The database is just a file inside the project.
```
npm install
copy .env.example .env 
npx prisma migrate dev --name init
npm start
```

Then open <http://localhost:5000>.
To make the first user an admin, run `npx prisma studio`, open the `users` table, set `is_admin` to `true`. The site admin can edit/delete any project (and is treated as a project admin everywhere).
## Project admin vs site admin

- **Project admin** — the user who created the project. Can manage members, threads, and any attachment/message inside that project. The site admin is also treated as a project admin on every project.
- **Member** — a user who was added to the project by its admin. Can read everything in the project, upload attachments, post messages, and edit / delete their own attachments and messages.

## Deploying to the cloud
The app is a stock Express + Prisma + SQLite stack so it deploys to most Node hosts. The simplest free option is **Render**:

1. Push the project to GitHub.
2. On Render, "New" → "Web Service" → connect the repo.
3. Build command: `npm install && npx prisma migrate deploy`
4. Start command: `npm start`
5. Add environment variables:
   - `DATABASE_URL` = `file:./dev.db`
   - `SESSION_SECRET` = a long random string
   - `PORT` = `5000` (Render sets this automatically; the app reads `process.env.PORT`)
6. Add a persistent disk mounted at the project root if you want uploads and the SQLite file to survive restarts. SQLite + ephemeral disks will lose data on every redeploy.

When the service goes live, replace the placeholder URL at the top of this README with your real URL.

## Permission model — quick reference

| Action                         | Who can do it                                       |
| ------------------------------ | --------------------------------------------------- |
| See a project                  | Creator, members, site admin                        |
| Edit / delete a project        | Creator, site admin                                 |
| Add / remove members           | Project admin (creator), site admin                 |
| Upload an attachment           | Any project member                                  |
| Delete an attachment           | The uploader, or the project admin                  |
| Create / edit / delete a thread | Project admin only                                  |
| Post a message                 | Any project member                                  |
| Edit / delete a message        | The author, or the project admin                    |

## Notes

- File uploads land in `./uploads/`. The original filename is kept for the download but the file on disk is renamed to `timestamp-random.ext` so two uploads with the same name don't clash.
- Allowed upload formats: png, jpg, jpeg, gif, webp, pdf, txt. Max size 10 MB. Both extension and MIME type are checked.
- `format` is stored on the `Attachment` row, so the project page can show a coloured tag without having to parse the filename again.
- Status (`active` / `banned`) is a plain string. SQLite has no enum type, so the values are validated in code.
- Sessions are stored as JSON files in `./sessions/`.
- Logout is POST (CSRF protection).
- Session ID is regenerated on login (session fixation protection).
- The user's real status is checked on every request — banned users are logged out automatically.

## Resetting the database
```
npx prisma migrate reset
```
This wipes the SQLite file and re-runs the migration. Uploaded files in `./uploads/` are not touched; delete that folder by hand if you want a totally clean slate.
