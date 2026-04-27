# BONDING Soup — local static demo (path + port)

`npm run demo` runs **Python** `http.server` with the **repository root** as the document root (so `soup.html`, `docs/`, `cognitive-passport/`, etc. resolve correctly). Implementation: **`scripts/demo-server.mjs`**.

## 1. Where the repo must live

There is no magic path. Clone or copy the home repo wherever you want, for example:

- `~/p31`
- `~/bonding-soup`
- `~/dev/p31`

If you are unsure you are in the right folder:

```bash
ls soup.html
```

If that prints `soup.html`, you are in the **repo root** (the same directory as `package.json`).

**Never** run the demo with `~` or `/path/to/...` as the server root unless that directory **is** the repo: serving your home directory will not serve `soup.html` from the project.

## 2. One-time prep

```bash
cd /path/to/your/clone
npm install
npm run build
npm run soup:prep
```

(Or `npm run setup` from the repo root for the full first-machine bar.)

## 3. Start the demo (from repo root)

```bash
cd /path/to/your/clone
npm run demo
```

The script prints the exact **base URL** and **`…/soup.html`**. Open that link in Chrome.

**From any directory** (as long as the path to the clone is correct):

```bash
npm run demo --prefix /path/to/your/clone
```

## 4. Port 8080 already in use (`Address already in use`)

Use another port:

```bash
P31_DEMO_PORT=8090 npm run demo
```

Open **`http://127.0.0.1:8090/soup.html`** (or whatever port you set).

To see what is holding 8080 (Linux, including Chromebook Linux / `penguin`):

```bash
ss -tlnp | grep ':8080'
# or
fuser 8080/tcp
```

Stop the other process, or keep using `P31_DEMO_PORT` and do not free 8080.

## 5. Chromebook (Linux / `penguin`)

1. **Linux** is enabled; clone lives under **Linux files**, e.g. `/home/p31/p31` or `~/p31` in the penguin home.
2. In a **Linux** terminal: `cd` to the clone, then **`npm run demo`** as above. Use the URL printed in the terminal, not a placeholder.
3. In **Chrome** (Linux or Chrome OS browser): open `http://127.0.0.1:PORT/...` . If a tab cannot reach the server, confirm the demo is running in the Linux terminal and the port matches the printed line.

**Perf / frame budget** notes: **`docs/SOUP-PERF-BUDGET.md`**.

**Full device spine (Spin-class Chromebook + phone):** **`docs/P31-DEVICE-SETUP-CHROMEBOOK-MOBILE.md`** · **`p31-device-setup.html`**.
