# Presidential date practice — self-hosted Node.js edition

Plain HTML/CSS/JavaScript with a Node.js server and SQLite. No npm dependencies, build step, Cloudflare account, or ChatGPT login required.

## What is included

- Username/password accounts with separate scores and learning histories.
- Reveal, then mark right/wrong to advance.
- Roughly 50% ordinary years, 25% handover practice, 25% reviews of weak areas. Before any mistakes, the review share becomes handover practice.
- Mistakes raise priority; successful reviews lower it. The latest 3,000 answers guide adaptation; all attempts count toward all-time totals.
- Session score resets on reload/sign-in. All-time scores and login sessions survive server restarts.
- Passwords use salted scrypt. Session tokens are random, stored hashed in SQLite, and sent using HttpOnly cookies (Secure in production).
- Origin checks and session-specific CSRF tokens protect writes; database-backed login throttles survive restarts.
- No password-reset emails. The server owner resets passwords with the included interactive command.

## Requirements and quick local start

Use Node.js **24.x LTS**, at least 24.0.0, including the built-in `node:sqlite` module. Keep Node patched. Node may print an experimental SQLite warning on some 24.x releases.

```sh
cd president-quiz-node
node --version
npm test
npm run account -- create david
npm start
```

The account command prompts twice with password input hidden. Passwords must be at least 12 characters and at most 256 UTF-8 bytes. Usernames are 3–32 letters, numbers, underscores or hyphens, case-insensitive.

Open **http://127.0.0.1:3000** and sign in. For local use, do not copy the production .env example unchanged. Defaults use that local address and store data at `data/quiz.sqlite`.

## Deploy to an Ubuntu/Debian DigitalOcean droplet

These instructions assume a domain such as `quiz.example.com`, Node 24 installed at `/usr/bin/node`, and Caddy installed as a system service. If Node is elsewhere, change `ExecStart` in the service file. No SSH access to your server was available when this package was prepared.

1. Point your domain's DNS A record at the droplet. If using an AAAA record, it must also point to working IPv6 on the droplet. Allow inbound TCP 80 and 443 in your DigitalOcean firewall and any host firewall. Keep your existing SSH access allowed. The Node port does not need public access.
2. Upload/extract this project into `/opt/president-quiz`. Do not put the database inside a publicly served directory.
3. Create the service user and persistent data directory:

```sh
sudo useradd --system --home /var/lib/president-quiz --shell /usr/sbin/nologin president-quiz
sudo install -d -m 700 -o president-quiz -g president-quiz /var/lib/president-quiz
sudo chown -R root:root /opt/president-quiz
```

If that user already exists, reuse it instead of running useradd again.

4. Copy and edit the environment file. Set APP_ORIGIN to your actual HTTPS origin, with no path or trailing slash:

```sh
sudo cp /opt/president-quiz/.env.example /etc/president-quiz.env
sudo chmod 600 /etc/president-quiz.env
sudo nano /etc/president-quiz.env
```

Example:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
APP_ORIGIN=https://quiz.example.com
DB_PATH=/var/lib/president-quiz/quiz.sqlite
ALLOW_REGISTRATION=false
TRUST_PROXY=true
```

TRUST_PROXY=true assumes the Node port is bound to loopback behind Caddy. The app uses the last X-Forwarded-For address set by the immediate proxy for login throttling. Do not expose that port directly or use arbitrary untrusted proxy chains.

5. Create your first account. This explicitly selects the same production database:

```sh
cd /opt/president-quiz
sudo -u president-quiz env DB_PATH=/var/lib/president-quiz/quiz.sqlite /usr/bin/node account.js create david
```

Repeat with a different username to create more accounts. You can instead allow web sign-up by setting ALLOW_REGISTRATION=true and restarting the service; every visitor can then create an account. Default false is appropriate for a personal site.

6. Install and start the Node service:

```sh
sudo cp /opt/president-quiz/deploy/president-quiz.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now president-quiz
curl http://127.0.0.1:3000/healthz
```

The health route should return `{"ok":true}`.

7. Add the block from `deploy/Caddyfile` to your existing Caddy configuration, replacing the domain. Preserve any other sites already configured:

```caddyfile
quiz.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Validate and reload:

```sh
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy obtains and renews HTTPS certificates when the domain and ports are configured correctly. Visit your HTTPS address and sign in. Do not serve production password login over plain HTTP.

## Accounts and password resets

```sh
cd /opt/president-quiz
sudo -u president-quiz env DB_PATH=/var/lib/president-quiz/quiz.sqlite /usr/bin/node account.js create another-user
sudo -u president-quiz env DB_PATH=/var/lib/president-quiz/quiz.sqlite /usr/bin/node account.js reset david
```

Reset preserves scores and signs out the account's existing sessions. There is no email service or recovery link to configure.

## Backups and updates

Use SQLite's online backup function rather than copying only the main database while the app is writing:

```sh
sudo -u president-quiz env DB_PATH=/var/lib/president-quiz/quiz.sqlite /usr/bin/node /opt/president-quiz/backup.js /var/lib/president-quiz/backup-2026-10-25.sqlite
```

Choose a fresh filename each time. Download backups to a separate machine; they contain account password hashes and learning history and should be treated as private. For automated daily backups, invoke this command from your normal backup system with a dated filename. The package does not install a backup schedule.

To restore, stop the service, preserve the current main database and its matching -wal/-shm files together, place the backup at DB_PATH with owner president-quiz and permissions 600, ensure no stale -wal/-shm files remain beside the restored database, then start the service. Test restores on a copy first.

For updates, back up first, stop the service, replace code under /opt/president-quiz, and restart. Leave /var/lib/president-quiz untouched. Schema upgrades are transactional and tracked with PRAGMA user_version.

Logs:

```sh
sudo journalctl -u president-quiz -n 100 --no-pager
```

## Existing hosted scores

This is a separate database. Accounts and progress from the earlier ChatGPT-hosted site are **not automatically migrated**. The hosted site remains available. This package starts with an empty database.

## Checks and implementation

Run `npm test`. Tests cover all handover boundaries, adaptive sampling, account isolation, persistence, duplicate-save handling, session expiry/logout, validation, CSRF/origin checks, secure cookie configuration, password hashing and login throttling.

There are no third-party packages to install. server.js uses built-in HTTP, SQLite and crypto APIs; public/ contains the frontend and complete accession-date data. Server-specific deployment and HTTPS still need to be verified on your droplet.

References:
- [Node.js SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)
- [Node.js scrypt](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback)
- [Caddy HTTPS setup](https://caddyserver.com/docs/quick-starts/https)
- [Presidential dates: National Archives](https://www.archives.gov/research/census/presidents)
- [House presidential chronology](https://history.house.gov/People/Other-Office/Member-President/)
