# P31 Chromebook command readiness

Checklist for the **local operator console** (`npm run command-center`, default **http://127.0.0.1:3131**) on **Chrome OS**: using Chrome as the client, running Node in **Linux (Crostini)**, or reaching another machine on the LAN.

## 1. Repo runs on the Chromebook (Linux / Crostini)

From the **Linux** terminal in your home checkout:

```bash
npm run command-center
```

Open **Chrome** (same Chromebook) at **http://127.0.0.1:3131/**. Chrome OS forwards loopback to the Linux container for typical dev ports; if a tab does not load, confirm Linux is running (**Settings → Developers → Linux**) and retry.

- **`P31_CMD_CENTER_NO_OPEN=1`** avoids `xdg-open` noise if no Linux GUI browser is configured.
- Optional: **`P31_CMD_CENTER_PORT`** if **3131** is busy.

## 2. Install as a PWA (Chrome)

After the console loads, use Chrome’s **install** flow (e.g. **Install P31 Console** / app icon in the address bar, or **⋮ → Save and share → Install page as app**). The page serves **`/manifest.webmanifest`** and PNG icons (**192** / **512** plus **`/apple-touch-icon.png`**) when **`p31-bonding-icons/`** is populated — same as other home PWAs. If icons are missing:

```bash
npm run generate:bonding-pwa-icons
```

## 3. Chromebook browser → another machine on the LAN

On the **machine that hosts the repo** (Mac, Linux PC, etc.), bind beyond loopback so the Chromebook can reach it:

```bash
P31_CMD_CENTER_LAN=1 npm run command-center
```

Use the printed **LAN** URL (**`http://<host-ipv4>:3131/`**) in Chrome on the Chromebook. **Trusted networks only** — same security model as **`docs/P31-IPHONE-COMMAND-READINESS.md`**.

## 4. Chromebook hosts the server and other devices need it

Run with LAN bind in **Linux**:

```bash
P31_CMD_CENTER_LAN=1 npm run command-center
```

Other devices use the Chromebook’s **Wi‑Fi IPv4** and port **3131**. If nothing connects, check **Linux firewall** rules in Crostini and that both devices share the same network (guest Wi‑Fi often blocks device-to-device traffic).

## 5. Not on the same LAN

Use **Tailscale** (or similar) on the **host that runs Node** and on the Chromebook; open **`http://<tailscale-ip>:3131/`**. Allow the port on the host firewall if needed.

## 6. Preview links

With **`P31_CMD_CENTER_LAN=1`**, preview links that point at **`127.0.0.1`** are rewritten to the host LAN IP so clicks from the Chromebook (or phone) still work.

## 7. Verify

```bash
npm run verify:command-center
```
