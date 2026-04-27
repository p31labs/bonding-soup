# P31 iPhone command readiness

Short checklist for using the **local operator console** (`npm run command-center`, default **http://127.0.0.1:3131**) from an iPhone: same trusted Wi‑Fi (or Tailscale), LAN bind, and a proper Home Screen icon.

## 1. LAN bind (required for the phone)

On the machine that runs the repo:

```bash
P31_CMD_CENTER_LAN=1 npm run command-center
```

The server listens on **all interfaces**. The terminal prints a **phone:** URL using your machine’s LAN IPv4. Open that URL in **Safari** on the iPhone.

**Security:** anyone on that LAN can trigger **whitelisted** actions only — use trusted networks.

Optional: `P31_CMD_CENTER_HOST=0.0.0.0` has the same bind behavior as `P31_CMD_CENTER_LAN=1`. Change port with `P31_CMD_CENTER_PORT`.

## 2. Home Screen icon

Safari requests **`/apple-touch-icon.png`**. The command center serves **`p31-bonding-icons/apple-touch-180.png`** at that path when the file exists.

If the file is missing:

```bash
npm run generate:bonding-pwa-icons
```

Then **Share → Add to Home Screen**. The web app manifest also lists **192** and **512** PNGs (same folder) for broader PWA clients.

## 3. Not on the same Wi‑Fi

Use **Tailscale** (or similar) and open **`http://<tailscale-ip>:3131/`** instead of the LAN URL. Ensure the host firewall allows the chosen port.

## 4. Preview links on 127.0.0.1

The console rewrites loopback preview URLs to your LAN IP when in LAN mode so taps from the phone still work.

## 5. Verify locally

```bash
npm run verify:command-center
```

This runs the smoke test, which checks the touch icon route and manifest when `p31-bonding-icons/apple-touch-180.png` is present.
