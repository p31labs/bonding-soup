# Matrix Zero-Budget Options for P31 Family (4 Users)
**Date:** 2026-05-04
**Author:** P31 Research Agent
**Scope:** Operator (adult), Brenda (adult, ADA support), S.J. (age 10), W.J. (age 6)
**Constraint:** ~$5 liquid cash, zero recurring cost strongly preferred
**Priority:** SMS bridge, email bridge, custody-safe private comms

> **Research note:** WebSearch was blocked in this session. All Oracle Free Tier
> notes are based on training data through mid-2025. Oracle in particular
> requires manual spot-check before proceeding — see the verification links in
> each section.

---

## 1. Options Comparison Table

| Option | Recurring Cost | Setup Effort | SMS Bridge | Email Bridge | Reliability | Verdict |
|---|---|---|---|---|---|---|
| **Conduit on Pi 4** (alongside HA) | $0 | Medium | Yes (mautrix-signal or matrix-sms-bridge) | Yes (mx-puppet-email or postmoogle) | Medium — power/ISP dependent | **Runner-up** |
| **Oracle Cloud ARM Free Tier** | $0 (if account survives) | Medium-High | Yes | Yes | High — datacenter grade | **Top pick** |
| **fly.io free tier** | $0 (very tight) | High | Unlikely — egress limits | Unlikely | Low — 256 MB VMs, likely OOM | Not recommended |
| **Cloudflare Workers + D1** | $0 | Very High | No (Matrix bridge protocol requires persistent TCP) | Partial (webhooks only) | Medium — edge network, no state | Fallback messaging only |
| **Desktop i3-12100** | ~$4–6/mo electricity | Low | Yes | Yes | Low — not always-on, no UPS | Emergency only |

---

## 2. Individual Option Analysis

### 2.1 Conduit on Raspberry Pi 4 (alongside Home Assistant)

**What Conduit is:** A Matrix homeserver written in Rust. Single binary, ~50 MB on disk. Designed explicitly for small deployments.

#### Memory and CPU

| Component | Idle RAM | Load RAM | Notes |
|---|---|---|---|
| Home Assistant core | ~300–500 MB | ~600 MB | Depends on integration count |
| Conduit (4 users, light) | ~40–80 MB | ~120 MB | Rust allocator, very lean |
| RocksDB (Conduit storage) | ~20–40 MB | ~80 MB | Grows with message history |
| OS + overhead | ~200 MB | ~300 MB | Raspberry Pi OS Lite |
| **Total** | **~560–820 MB** | **~1.1 GB** | Pi 4 has 4 GB — safe margin |

A Pi 4 (any RAM variant ≥ 2 GB) can comfortably run both. The 4 GB model gives ample headroom. Conduit does not spike CPU on a 4-person homeserver; it is idle nearly 100% of the time.

**HA degradation risk:** Minimal at this scale. The only risk is RocksDB doing compaction simultaneously with an HA automation burst. In practice this is a non-event.

#### Docker vs. Native Install

**Recommendation: Native install via the official binary or the `conduit` crate from `crates.io`.**

Rationale:
- Docker on Pi 4 adds ~200 MB RAM overhead for the daemon and layer caching.
- HA is often installed via the supervised or OS method, which can conflict with Docker networking (bridge modes, port contention).
- Native binary is a single file; systemd unit is 10 lines. Easier to manage and restart cleanly.

If HA is already using Docker Compose, then a Docker install of Conduit is fine — share the compose stack.

#### Storage Requirements (4 users, light usage)

| Data Type | Year 1 Estimate |
|---|---|
| Conduit DB (RocksDB) | ~500 MB – 1 GB |
| Media (photos, voice) | ~2–5 GB (depends on bridges) |
| Config + certs | < 10 MB |
| **Total** | **~3–6 GB** |

A 32 GB microSD handles this easily. **Use an external USB SSD** for the Conduit data directory — microSD write endurance is a real failure mode for database workloads. A 64 GB USB 3.0 flash drive ($6 one-time) is sufficient and eliminates the SD card wear concern.

#### Bridges Available

| Bridge | Transport | Notes |
|---|---|---|
| `mautrix-signal` | Signal protocol (not SMS directly) | Requires Signal account on a phone number; Brenda must use Signal or Signal Bridge relays to her SMS |
| `matrix-sms-bridge` | GSM modem or SIM | Needs a USB GSM modem (~$20 one-time) or a SIM-enabled device; sends/receives true SMS |
| `mautrix-gmessages` | Google Messages RCS/SMS | Proxies through a paired Android phone; **most practical for Brenda** |
| `postmoogle` | SMTP/IMAP email | Full email bridge — two-way email via Matrix room; actively maintained |
| `mx-puppet-email` | IMAP polling | Older, simpler; receive-only unless paired with SMTP relay |

**Most practical SMS path for Brenda:** Deploy `mautrix-gmessages` (or `mautrix-android-sms`) paired to an Android phone. No hardware purchase required. Messages to/from Brenda's number appear in a Matrix DM room.

#### Network Requirements

- Port 8448 (Matrix federation) and 443 must be reachable. Federation should be **disabled** for a private family server.
- Use Cloudflare Tunnel (free) to expose Conduit without opening router ports. The tunnel runs as a daemon on the Pi, outbound-only connection to Cloudflare edge. No port forwarding required.
- DNS: `matrix.p31ca.org` or `matrix.phosphorus31.org` — already controlled, zero cost.

#### Known Gotchas

- Conduit does not support full Matrix spec as of 2025 (no threads, limited VoIP). For custody comms (text + attachments), this is fine.
- Federation is off by default on private instances — leave it off. Family comms stay on-server.
- Power outages: HA is already affected by power outages. If the Pi goes down, Matrix goes down. A $15 UPS (APC BE425M) covers both.

---

### 2.2 Oracle Cloud Always Free Tier

> **CRITICAL: Verify before committing. Oracle free tier terms change without notice.
> Check: https://www.oracle.com/cloud/free/#always-free — look for "Always Free" label.**

#### What Oracle Advertises (as of mid-2025 training data)

- **2 AMD micro instances** (1/8 OCPU, 1 GB RAM each) — Always Free
- **ARM (Ampere A1) compute pool**: Up to 4 OCPU + 24 GB RAM total, always free — this is the useful one
  - Can be configured as 1 VM with 4 OCPU + 24 GB, or split into up to 4 VMs
- **Block storage**: 200 GB total across volumes
- **Outbound bandwidth**: 10 TB/month (!)
- **Object Storage**: 20 GB
- **Autonomous Database (ATP/ADW)**: 2 instances, 20 GB each

For a Matrix server: a single VM with 2 OCPU + 4 GB RAM is more than enough for 4 users with Synapse (the heavyweight server) or Conduit.

#### Account Termination Reality

**This is the biggest risk.** Known patterns from community reports through 2025:

1. **"Idle resource reclamation"** — Oracle claims the right to reclaim Always Free resources that are "idle." Reports exist of VMs being terminated after 30-90 days of low CPU usage. Conduit on 4 users is almost always "idle" by Oracle's metrics.

2. **The mitigation:** Run a lightweight cron job that generates periodic CPU activity (e.g., `stress-ng` for 5 minutes every 6 hours, or a local backup script). This keeps the VM "active."

3. **Credit card required at signup** — Oracle requires a valid credit card to verify identity. The card is charged $0, but this is a hard requirement. If the operator has a card (even with $0 balance), it usually works.

4. **Region availability** — ARM free instances are often capacity-constrained. US East (Ashburn) or US West (Phoenix) are most available. May require multiple signup attempts or waiting.

5. **Account terminations without warning** — Multiple Reddit threads (r/selfhosted, r/oraclecloud) document accounts deleted for "violating ToS" with no clear violation. Treat it as a free VPS that could vanish with 30 days warning in the best case, zero days in the worst.

**Verdict on Oracle:** The ARM free tier is technically excellent for running Conduit or Synapse. The account stability risk is real but manageable with regular backups and the "keep-alive" cron pattern. For custody comms, the risk of sudden termination is significant. Always maintain a local backup export.

#### Running Matrix on Oracle ARM

Conduit on the ARM VM:
```bash
# Conduit binary (single executable, runs natively on aarch64)
wget https://gitlab.com/famedly/conduit/-/releases/permalink/latest/downloads/conduit-aarch64-unknown-linux-musl
chmod +x conduit-*
# Configure via conduit.toml, systemd unit
```

Synapse (the reference server) also runs fine on 4 GB ARM — uses ~500 MB RAM for a tiny homeserver.

**Outbound bandwidth:** 10 TB/month free is effectively unlimited for 4 users.

---

### 2.3 fly.io Free Tier

**Current free allowance (as of mid-2025):**
- 3 shared-CPU VMs with 256 MB RAM each
- 3 GB persistent volume storage
- 160 GB outbound data/month
- Free tier requires a valid credit card (even for $0 usage)

**Can Matrix run on this?**

- Conduit with SQLite backend *technically* fits in 256 MB RAM but will be tight. Any media upload or bridge activity can push it over.
- 3 GB persistent volume for database + media is barely enough for initial deployment, will fill within months.
- fly.io "suspend" behavior: free machines are suspended when idle and cold-start on connection. Matrix requires persistent connections (sync long-polling). Cold starts will cause client disconnections and missed push notifications.
- No static IP on free tier without a paid plan.

**Verdict: Not recommended.** The 256 MB limit and cold-start behavior make Matrix unreliable. fly.io is better suited for stateless HTTP APIs.

---

### 2.4 Cloudflare Workers + D1 as Pseudo-Matrix

#### Can Workers serve the Matrix Client-Server API?

**Short answer: No, not fully. Partial, with significant caveats.**

Matrix Client-Server API (`/_matrix/client/v3/sync`) relies on:
1. Long-polling HTTP (the `/sync` endpoint can hold a connection open for 30+ seconds waiting for events)
2. Persistent WebSocket connections for push
3. Stateful session management

Cloudflare Workers has a **30-second CPU time limit** (free tier: 10ms CPU, not wall clock — so a 30-second long-poll consumes the CPU limit instantly unless the Worker yields). This breaks `/sync`.

Durable Objects can hold WebSocket connections, but implementing the full Matrix spec on top of DO + D1 is a multi-month engineering project.

**D1 storage limits (free tier):**
- 5 GB total storage
- 5 million row reads/day, 100K row writes/day
- Sufficient for text-only message history for 4 users

#### Alternative: P31-Native Message Relay (not Matrix spec)

A simpler design that is achievable on the existing Workers fleet:

```
Workers endpoint: /api/msg/send, /api/msg/poll
D1: messages(id, from, to, body, ts, read)
KV: session tokens
R2: media attachments
```

This is not Matrix spec and won't work with any Matrix client (Element, FluffyChat, etc.). Users would need a custom P31 client or a simple web app.

**SMS bridge:** Not possible from Workers directly. Workers cannot open outbound TCP connections to SMPP providers or GSM modems. Could integrate with Twilio's HTTP API (free tier: $15 trial credit, then ~$0.0075/SMS) but that introduces recurring cost.

**Email bridge:** Possible via Workers + MailChannels (free for Workers) or Resend/Postmark. Outbound email is achievable. Inbound email requires a separate inbound parsing service.

**Verdict:** Workers + D1 is a viable fallback messaging system for the P31 family mesh (text + attachments), but it cannot bridge to Brenda's SMS without a paid SMS API. It does not satisfy the hard requirement of SMS bridge at zero cost.

---

### 2.5 Desktop Self-Host (i3-12100)

#### Power Cost Estimate

| Scenario | Wattage | Hours/Day | kWh/Month | Cost at $0.12/kWh | Cost at $0.16/kWh |
|---|---|---|---|---|---|
| Idle (no GPU load) | ~35–45W | 24 | ~32 kWh | ~$3.84 | ~$5.12 |
| Matrix server only (minimal) | ~30–40W | 24 | ~29 kWh | ~$3.48 | ~$4.61 |
| Always-on with GPU at idle | ~55–75W | 24 | ~47 kWh | ~$5.64 | ~$7.52 |

The i3-12100 without the GPU draws ~30–45W idle. Running Matrix-only with GPU disabled (or removed) brings it to the ~$3.50–5.00/month range. With the RX 6600 XT in the system but idle, add ~10–15W.

**This is not zero-cost** — $4–6/month is the estimated electrical overhead vs. baseline. Whether this is "acceptable" depends on whether the desktop runs anyway.

#### Dynamic DNS via Cloudflare API

Cloudflare provides a free API for DNS record updates. The standard approach:

```bash
# ddclient or a simple cron script
# /etc/cron.d/cf-ddns
*/5 * * * * root /usr/local/bin/cf-update-dns.sh

# cf-update-dns.sh (minimal)
IP=$(curl -s https://api.ipify.org)
curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$CF_RECORD_ID" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"A\",\"name\":\"matrix.p31ca.org\",\"content\":\"$IP\",\"proxied\":false}"
```

This keeps the DNS A record current as the ISP changes the IP. Cloudflare Tunnel is simpler (no script, just a daemon) and avoids exposing the desktop's IP publicly.

#### Reliability Concerns

- **Not always-on** is disqualifying for custody comms. If the desktop is off during a custody transfer window, messages fail silently.
- No UPS = power outage = Matrix down exactly when needed most (stressful situations correlate with power events).
- ISP residential connection = possible CGNAT (blocks inbound connections; Cloudflare Tunnel mitigates this).

**Verdict:** Use as a development/testing environment only. Not suitable as primary custody comms infrastructure.

---

## 3. Top Recommendation: Oracle Cloud ARM + Conduit

### Decision Rationale

Oracle ARM free tier wins on paper for reliability (datacenter power, static IP, 10 TB egress). The Pi 4 wins on stability (no account termination risk, fully under operator control). Given the custody comms requirement, **the correct strategy is:**

1. **Primary:** Pi 4 with Conduit (zero termination risk, always under operator control, Cloudflare Tunnel for access)
2. **Backup/failover:** Oracle ARM instance as a cold standby, with nightly exports from Pi 4

However, if Oracle account signup is feasible (valid credit card exists), the Oracle instance makes an excellent primary with the Pi as a local backup.

**For this guide, we document the Pi 4 path as primary** because it has zero account termination risk and the hardware already exists.

---

## 4. Step-by-Step Deployment: Conduit on Raspberry Pi 4

### Prerequisites Checklist

- [ ] Raspberry Pi 4 (2 GB+ RAM recommended; 4 GB ideal)
- [ ] 64 GB USB 3.0 flash drive or USB SSD for Conduit data
- [ ] Existing Cloudflare account with `p31ca.org` or `phosphorus31.org` DNS
- [ ] Android phone with Google Messages (for `mautrix-gmessages` SMS bridge to Brenda)
- [ ] Domain to use: suggested `matrix.p31ca.org`

### Step 1: Prepare the Pi

```bash
# SSH into Pi (assume Raspberry Pi OS Lite, 64-bit)
sudo apt update && sudo apt upgrade -y

# Mount the USB drive for Conduit data
sudo mkdir -p /data/conduit
# Find device: lsblk
sudo mkfs.ext4 /dev/sda1  # adjust device
sudo mount /dev/sda1 /data/conduit

# Add to /etc/fstab for persistence
echo "UUID=$(blkid -s UUID -o value /dev/sda1) /data/conduit ext4 defaults,noatime 0 2" | sudo tee -a /etc/fstab
```

### Step 2: Install Conduit Binary

```bash
# Get latest aarch64 build
CONDUIT_VERSION="v0.9.0"  # check https://gitlab.com/famedly/conduit/-/releases
wget "https://gitlab.com/famedly/conduit/-/releases/${CONDUIT_VERSION}/downloads/conduit-aarch64-unknown-linux-musl" \
  -O /usr/local/bin/conduit
chmod +x /usr/local/bin/conduit

# Create dedicated user
sudo useradd -r -s /usr/sbin/nologin -d /data/conduit conduit
sudo chown -R conduit:conduit /data/conduit
```

### Step 3: Configure Conduit

```bash
sudo mkdir -p /etc/conduit
sudo tee /etc/conduit/conduit.toml > /dev/null << 'EOF'
[global]
server_name = "p31ca.org"
database_path = "/data/conduit/db"
database_backend = "rocksdb"

port = 6167
max_request_size = 20_000_000  # 20 MB

allow_registration = false       # no public signups
allow_federation = false         # private family server; DO NOT enable

# Trusted IPs (local network only)
trusted_proxies = ["127.0.0.1/32", "::1/128"]

[global.tls]
# TLS is handled by Cloudflare Tunnel — leave blank
EOF

sudo chown -R conduit:conduit /etc/conduit
```

### Step 4: Systemd Service

```bash
sudo tee /etc/systemd/system/conduit.service > /dev/null << 'EOF'
[Unit]
Description=Conduit Matrix Homeserver
After=network.target
Wants=network-online.target

[Service]
User=conduit
Group=conduit
ExecStart=/usr/local/bin/conduit /etc/conduit/conduit.toml
Restart=on-failure
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable conduit
sudo systemctl start conduit

# Verify
sudo systemctl status conduit
curl http://localhost:6167/_matrix/client/versions
```

### Step 5: Cloudflare Tunnel (No Port Forwarding Required)

```bash
# Install cloudflared on Pi
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared bookworm main' | \
  sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared

# Authenticate (opens browser on desktop — may need to copy URL)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create matrix-p31

# Configure tunnel
sudo tee ~/.cloudflared/config.yml > /dev/null << 'EOF'
tunnel: matrix-p31
credentials-file: /home/pi/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: matrix.p31ca.org
    service: http://localhost:6167
  - service: http_status:404
EOF

# Route DNS (sets CNAME in Cloudflare automatically)
cloudflared tunnel route dns matrix-p31 matrix.p31ca.org

# Run as service
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### Step 6: .well-known Delegation (Required for Matrix Clients)

Matrix clients look up `p31ca.org` to find the server at `matrix.p31ca.org`. Two methods:

**Method A: Workers well-known (recommended — free, no Pi dependency)**

Deploy a Cloudflare Worker to `p31ca.org`:

```javascript
// worker: handle /.well-known/matrix/*
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/.well-known/matrix/client') {
      return Response.json({
        "m.homeserver": { "base_url": "https://matrix.p31ca.org" }
      });
    }
    if (url.pathname === '/.well-known/matrix/server') {
      return Response.json({ "m.server": "matrix.p31ca.org:443" });
    }
    return new Response('Not found', { status: 404 });
  }
};
```

**Method B: Nginx on Pi serving well-known**
Less reliable because it requires the Pi to be up just for discovery.

### Step 7: Create User Accounts

```bash
# Conduit uses admin rooms or the registration token approach
# For 4 users, use the built-in admin CLI (Conduit v0.9+):

conduit --config /etc/conduit/conduit.toml admin register-user \
  --username will --password "changeme" --admin true

conduit --config /etc/conduit/conduit.toml admin register-user \
  --username brenda --password "changeme"

conduit --config /etc/conduit/conduit.toml admin register-user \
  --username sj --password "changeme"

conduit --config /etc/conduit/conduit.toml admin register-user \
  --username wj --password "changeme"
```

User IDs will be: `@will:p31ca.org`, `@brenda:p31ca.org`, `@sj:p31ca.org`, `@wj:p31ca.org`

### Step 8: SMS Bridge via mautrix-gmessages

This pairs the server to an Android phone that has Brenda's number (or a dedicated relay phone). Brenda does not need to install anything — she sends/receives normal SMS on her phone.

```bash
# Install on Pi
sudo apt install -y python3 python3-pip python3-venv
python3 -m venv /opt/mautrix-gmessages
source /opt/mautrix-gmessages/bin/activate
pip install mautrix-gmessages

# Generate config
cd /data/conduit/bridges
mautrix-gmessages -g -c config.yaml

# Edit config.yaml:
# homeserver.address: http://localhost:6167
# homeserver.domain: p31ca.org
# bridge.permissions:
#   "@will:p31ca.org": admin
#   "@brenda:p31ca.org": user

# Register bridge with Conduit (adds to conduit.toml)
mautrix-gmessages -c config.yaml -r registration.yaml
# Add registration.yaml path to conduit.toml under app_service_registration_files

# Systemd unit for bridge
sudo tee /etc/systemd/system/mautrix-gmessages.service > /dev/null << 'EOF'
[Unit]
Description=mautrix-gmessages bridge
After=conduit.service
Requires=conduit.service

[Service]
User=conduit
WorkingDirectory=/data/conduit/bridges
ExecStart=/opt/mautrix-gmessages/bin/mautrix-gmessages -c config.yaml
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable mautrix-gmessages
sudo systemctl start mautrix-gmessages
```

Brenda links her Android by scanning a QR code shown by the bridge bot in a Matrix DM. After that, messages to her SMS number arrive in a Matrix room.

### Step 9: Email Bridge via postmoogle

postmoogle provides a full two-way email bridge: email to `will@p31ca.org` lands in a Matrix room; messages sent from that room go out as email.

```bash
# Download postmoogle (single binary)
wget https://github.com/etkecc/postmoogle/releases/latest/download/postmoogle-linux-arm64 \
  -O /usr/local/bin/postmoogle
chmod +x /usr/local/bin/postmoogle

# Config: /etc/postmoogle/config.yaml
# Requires SMTP inbound (port 25) — problematic on residential ISP
# Alternative: use Cloudflare Email Routing to forward to a webhook,
# then a Worker posts to Matrix via the postmoogle HTTP API
```

**SMTP inbound note:** Port 25 is blocked by most residential ISPs. Options:
1. Use Cloudflare Email Routing (free) to receive email at `@p31ca.org`, forward to a Cloudflare Worker, which calls Conduit's API to post the message.
2. Use a free SMTP relay (Mailgun free tier: 1000 emails/month) for inbound parsing.

Outbound email from Matrix → email: postmoogle uses a standard SMTP relay. MailChannels via Cloudflare Workers is free for outbound.

### Step 10: Backup Strategy

```bash
# Daily backup of Conduit DB to R2
# /usr/local/bin/conduit-backup.sh
#!/bin/bash
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
systemctl stop conduit
tar -czf /tmp/conduit-backup-${TIMESTAMP}.tar.gz /data/conduit/db
systemctl start conduit
# Upload to R2 via rclone or wrangler (already in P31 toolchain)
rclone copy /tmp/conduit-backup-${TIMESTAMP}.tar.gz r2:p31-backups/matrix/
rm /tmp/conduit-backup-${TIMESTAMP}.tar.gz

# Cron: daily at 3am
echo "0 3 * * * root /usr/local/bin/conduit-backup.sh" | sudo tee /etc/cron.d/conduit-backup
```

---

## 5. Oracle Cloud ARM: If You Go This Route

### Account Signup Notes (verify current state before attempting)

1. Go to https://www.oracle.com/cloud/free/ — confirm ARM is still "Always Free"
2. Select region: **US East (Ashburn)** — best ARM availability
3. Use a valid credit card (charged $0). Prepaid cards often fail. If operator has a debit card, it usually works.
4. **Do not upgrade to "Pay As You Go" unless explicitly needed** — the upgrade changes account type and removes free tier protections in some configurations.

### Keep-Alive Pattern (prevent idle termination)

```bash
# /etc/cron.d/oracle-keepalive
# Runs a 2-minute CPU burst every 6 hours to prevent "idle resource reclamation"
0 */6 * * * root stress-ng --cpu 2 --timeout 120 --quiet

# Install stress-ng
sudo apt install stress-ng
```

### Conduit Install on Oracle ARM (aarch64)

The same binary from Step 2 above (`conduit-aarch64-unknown-linux-musl`) runs natively on Oracle ARM. Use `iptables` or `ufw` to restrict port 8448 (federation) to localhost only.

Oracle provides a static public IP. Configure Cloudflare DNS proxy (`proxied: true`) in front of it to hide the server IP. Matrix federation should stay disabled for a private family server — the Cloudflare proxy will break federation anyway, which is the desired behavior.

---

## 6. Minimum Viable Comms Fallback

If none of the Matrix options are operational (Pi dies, Oracle terminates account, etc.), P31 has a fallback stack that costs $0 and can be deployed in under 30 minutes:

### Tier 1: Signal Group (Immediate — 0 setup)

- Create a Signal group: Operator + Brenda (Brenda must install Signal — one-time ask)
- S.J. and W.J. on shared devices with parental Signal accounts
- Pros: E2E encrypted, custody-chain screenshots work, no server to maintain
- Cons: Requires Brenda to install an app; no bridge, no archival
- **This is the emergency fallback and should be set up today regardless**

### Tier 2: Cloudflare Workers + D1 Mini-Relay

A simple P31-native relay using the existing Workers fleet. Not Matrix spec, but functional for text + media:

```
POST /api/family/send   — authenticated via KV session tokens
GET  /api/family/poll   — returns messages since last_seen_id
POST /api/family/ack    — marks messages read
```

D1 schema (fits in free tier for years):
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  from_user TEXT NOT NULL,
  to_room TEXT NOT NULL DEFAULT 'family',
  body TEXT NOT NULL,
  media_key TEXT,           -- R2 object key for attachments
  ts INTEGER NOT NULL,
  read_by TEXT DEFAULT '[]' -- JSON array of user IDs
);
CREATE INDEX idx_ts ON messages(ts);
CREATE INDEX idx_room ON messages(to_room);
```

Accessible via any browser at `comms.p31ca.org` — a 200-line React app or vanilla JS. Works on Brenda's phone without any app install. No SMS bridge, but satisfies the private + reliable requirement for text.

### Tier 3: Proton Mail Group (Already free)

For documentation-quality comms (custody orders, medical instructions):
- `will@proton.me` and a shared alias for family broadcasts
- Proton Mail free tier: unlimited storage (1 GB), no ads, E2E encrypted
- Brenda receives normal email; no app install required
- Use subject line conventions: `[CUSTODY]`, `[MEDICAL]`, `[SCHOOL]`

### Tier 4: SMS Directly (Last Resort)

For S.J. and W.J. urgent contacts: operator's cell number (known to Brenda and school). No tech dependency.

---

## 7. Decision

### Recommended Path (ordered)

1. **Set up Signal group today.** Zero cost, zero tech debt, works now. Gets Brenda reliable encrypted contact with operator regardless of server status. This is not optional — custody comms need a baseline that works before infrastructure is built.

2. **Deploy Conduit on Pi 4 within 1–2 weeks.** The Pi is already running 24/7 for HA. Adding Conduit costs $0 and ~2 hours of setup time. Use Cloudflare Tunnel for access. Use mautrix-gmessages to bridge to Brenda's SMS. This satisfies all hard requirements.

3. **Attempt Oracle ARM signup.** If successful, use it as a hot standby or promote it to primary (datacenter reliability > Pi reliability for custody comms). If Oracle terminates the account, the Pi is still operational. If Oracle account signup fails (no valid card, ARM capacity unavailable), skip.

4. **Deploy Workers + D1 mini-relay as belt-and-suspenders.** Takes ~4 hours using existing Workers infrastructure. Provides browser-based messaging as a failover if both Pi and Oracle are down.

### Explicit Non-Decisions

- **Do not use fly.io** for Matrix. The 256 MB limit and cold-start behavior make it unsuitable for persistent comms.
- **Do not run Matrix on the desktop** as a primary service. Power cost + reliability are both wrong for custody communications.
- **Do not enable Matrix federation.** Family comms stay on-server. Federation leaks room metadata to third-party servers.

### Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pi 4 power outage | Medium | High | $15 UPS; Signal as fallback |
| Oracle account termination | Medium | Medium | Pi is primary; Oracle is backup |
| ISP dynamic IP disrupts access | Low | Low | Cloudflare Tunnel is not IP-dependent |
| microSD failure | High (over 2yr) | High | Conduit DB on USB SSD, not microSD |
| Brenda refuses to install Signal | Low | Medium | Workers relay is browser-based, no install |

### Cost Summary

| Item | One-Time | Recurring |
|---|---|---|
| USB SSD/drive for Conduit DB | ~$0–10 (likely have one) | $0 |
| UPS for Pi | ~$15 (optional) | $0 |
| Cloudflare Tunnel | $0 | $0 |
| Oracle ARM VM | $0 | $0 (verify) |
| Signal | $0 | $0 |
| Workers + D1 relay | $0 | $0 |
| **Total** | **~$0–25** | **$0** |

The only electrical cost is the Pi 4, which is already powered on for Home Assistant. Adding Conduit adds approximately 0–5W (within measurement noise). Net new power cost: $0.

---

*Last updated: 2026-05-04. Oracle Free Tier status requires manual verification at https://www.oracle.com/cloud/free/ before proceeding.*
