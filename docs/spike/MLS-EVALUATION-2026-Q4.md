# MLS (RFC 9420) Evaluation Spike — 2026-Q4

**Status:** Evaluation spike. **Decision document, not a ship.**
**Schema:** `p31.spike/1.0.0`
**Edition:** 1.0.0
**Authored:** 2026-05-02 by Cursor agent under operator command authority
**Phase:** PEER-2C of `docs/CWP-P31-PEER-COMP-2026-05.md`
**Phase 3 entry point:** PEER-3A — first MLS-bearing surface (group key agreement on Cloudflare Worker)

---

## 0. The decision (for impatient readers)

| Field | Decision |
|-------|----------|
| Adopt MLS for P31 group cryptography? | **Yes**, in Phase 3 (Q1 2027), gated on this spike + funding. |
| Reference implementation | **OpenMLS** (Rust, AGPL → consider re-licensing path; if blocked, fall back to **mls-rs** Apache-2.0). |
| Deployment substrate | **Cloudflare Workers via WASM** (compile OpenMLS to wasm32-unknown-unknown; storage in DO + KV). |
| First surface | **Family K₄ mesh secure broadcast** (cage-scoped; 4 members; Welcome flow over already-paired passkey channel). |
| Out of scope | Stranger-to-stranger messaging; voice/video; federation. |
| Risk | OpenMLS license; WASM size budget; DO storage cost at scale. All addressable. |

If P31 has zero appetite for AGPL, **mls-rs** (Apache-2.0, AWS-stewarded) is the safe default and the rest of this evaluation still applies.

---

## 1. Why MLS at all

P31 has historically deferred encrypted group messaging because:

1. The K₄ family mesh is small (four people) and currently transports state, not human messages.
2. We did not want to invent a protocol.
3. We did not want to operate a centralized SFU or messaging server.

MLS (RFC 9420) changes all three:

1. It is **standardized** by the IETF Messaging Layer Security WG. Co-authored by Cisco, Google, Mozilla, Wickr (now AWS), Wire, and Twitter (per the RFC's acknowledgments). This is not a one-vendor protocol.
2. It is **designed for groups** — efficient `O(log n)` updates via TreeKEM ratchet trees, post-compromise security, forward secrecy.
3. It separates **the cryptographic protocol** from **the delivery service** ("Authentication Service" + "Delivery Service" in MLS terminology). P31 can run only the AS for our family mesh and let users' devices speak directly via existing transports.

For P31 specifically, MLS unlocks:

- **Family group secure broadcast.** Operator → cage members. Children's devices stay sane even without a server.
- **Forward secrecy on the family mesh edges.** The current `k4-cage` Worker is plaintext-in-DO. MLS would let us encrypt edge messages such that even Cloudflare cannot read them.
- **Standards alignment.** Phase 4 (Standards Position registration) requires that we are using something the standards bodies recognize.

---

## 2. RFC 9420 in 5 pages

(Authored from operator-readable summary; the spike author is expected to read the full RFC, not rely solely on this summary.)

### 2.1 The objects

- **KeyPackage:** A user's "I exist and here is how to send to me" record. Contains an HPKE init key, signature key, supported ciphersuite, and a leaf node identifier. Fetched ahead of time from the AS.
- **GroupContext:** Static parameters of the group (group ID, epoch, ciphersuite, list of confirmed extensions).
- **Welcome:** The message that admits a new member to a group. Encrypts the group secret to the new member's KeyPackage.
- **Commit:** A message that updates the group state (add member, remove member, update key). Confirmed by all current members.
- **Application messages:** Encrypted to the group's current epoch secret. Decrypted by all members. Forward-secret because the epoch advances on Commits.

### 2.2 The mechanics — TreeKEM

Each group member is a leaf in a **left-balanced binary tree**. Each node holds a HPKE key pair. The root holds the group secret.

When a member updates their leaf key, only `O(log n)` nodes on the path from leaf to root need to be re-encrypted. This is the efficiency win over Signal's pairwise ratchets for groups.

When a member is removed, their leaf is blanked and the path is re-keyed. Any future application message is unreadable to the removed member (forward secrecy).

When a member is added, a `Welcome` is encrypted to their `KeyPackage` containing the current group secret. They join at the next epoch.

### 2.3 The ciphersuites

Most modern implementations support:
- `MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519` (most common; adequate)
- `MLS_256_DHKEMX25519_CHACHA20POLY1305_SHA256_Ed25519` (slightly more secure variant)
- Post-quantum variants are in flight (`MLS_256_DHKEMX25519MLKEM768_*`); not in RFC 9420 itself but in companion drafts. We should **track** but not block on these.

P31 default for Phase 3 will be `MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519` (interop-friendly, broadly supported).

### 2.4 What MLS does NOT solve

- **Identity binding.** MLS uses signature keys but does not say where they come from. P31 will bind via passkey + an out-of-band family pact (already in the spec for the planetary onboard flow).
- **Delivery.** MLS produces encrypted blobs. Something has to ship them. P31 will use a Cloudflare Worker as a fan-out point (it sees only ciphertext).
- **Membership consistency.** MLS assumes members agree on the current list. P31 will use the existing `k4-cage` Durable Object as the canonical roster (it sees membership, not message content).
- **Spam.** MLS is a key agreement protocol, not a spam filter. For a 4-person family mesh, this is not a real concern.
- **Asynchronous group history.** MLS does not give new members access to messages sent before they joined (and this is intentional — forward secrecy). P31 will treat this as a feature.

---

## 3. Implementation candidates

| Implementation | Language | License | Bindings | Notes |
|----|----|----|----|----|
| **OpenMLS** | Rust | AGPL-3.0 | Rust + WASM (via wasm-bindgen) | Most actively developed. Wire / Phoenix R&D / Cisco contributors. **License is the only real concern.** |
| **mls-rs** | Rust | Apache-2.0 | Rust + WASM + Swift bindings | AWS-stewarded (formerly Wickr). Production-quality. Apache-2.0 is the friendlier license. |
| **MLSpp** | C++ | BSD-2-Clause | C / Python via pybind | Cisco. Reference-quality, less plug-and-play for our stack. |
| **MLS.swift** | Swift | Apache-2.0 | iOS / macOS native | Apple stack only. Not a Cloudflare Worker option. |
| **mls-tsh** | TypeScript | (unclear) | Browser/Node | Pure-JS sidekick implementations exist; none we'd run cryptography on without an audit. |

### 3.1 Recommendation

**Primary:** `mls-rs` (Apache-2.0, AWS-backed, ships Swift bindings for free which helps the eventual mobile path).

**Alternate:** `OpenMLS` if `mls-rs` proves too coarse (e.g. its API hides things we need to control on the WASM target). Adopting `OpenMLS` requires either accepting AGPL across our consuming Worker (acceptable for a P31-internal Worker; problematic if we ship a library) or negotiating a relicense.

**Reject:** building our own. P31 is one operator. Rolling crypto is a fast track to having a CVE in Year Two.

---

## 4. Deployment architecture (3-party demo, the spike's "show me it works")

This is the smallest meaningful demonstration we can build to validate that MLS belongs in the P31 stack.

### 4.1 Topology

```
+----------------+
| Operator (O)   |  <-- runs OpenMLS in a browser tab via WASM
| Browser tab    |
+--------+-------+
         |
         | KeyPackage exchange via Worker
         |
+--------v-----------------+
| Cloudflare Worker        |
| - HPKE-enc message relay |  <-- sees only ciphertext
| - KeyPackage storage     |
| - Membership roster      |
+--------+-----------------+
         |
+--------+-------+    +----------------+
| S.J. (child A) |    | W.J. (child B) |
| Browser tab    |    | Browser tab    |
+----------------+    +----------------+
```

### 4.2 Demonstrated properties

1. **Group creation.** Operator creates `family-broadcast` group. Adds S.J. and W.J. via their KeyPackages.
2. **Welcome flow.** S.J. and W.J. each receive a Welcome and join the group.
3. **Application messages.** Operator sends "Be home for dinner." Both children's tabs decrypt and display.
4. **Update rotation.** Operator rotates their leaf key. The next application message uses the new epoch.
5. **Forward secrecy verification.** A passive observer of the Worker's storage cannot decrypt past application messages with the current epoch keys.
6. **Member removal.** Operator removes S.J. (e.g. simulating device compromise). W.J. continues to receive messages; S.J. cannot.

### 4.3 What the spike does NOT prove

- Production-grade key storage (the demo uses localStorage; production needs a hardware-backed keystore via the platform authenticator).
- Persistent message storage (the demo is ephemeral; production needs an MLS-aware async delivery layer).
- Cross-device sync (the demo is one tab per user; production needs the same identity across multiple devices, which is a Phase 3+ work item).
- Mobile (the demo is desktop browser; mobile is Phase 5).

### 4.4 Storage and bandwidth budget

Per the OpenMLS / mls-rs benchmarks (approximate, depending on group size):

- KeyPackage size: ~500 bytes
- Welcome message: ~1 KB per added member
- Commit message: ~500 bytes + 100 bytes per affected leaf
- Application message overhead: ~80 bytes + payload

For a 4-member family mesh at 100 messages/day, the daily Worker bandwidth contribution is < 100 KB. Trivially within Cloudflare Workers free tier.

WASM blob size for the cryptographic core: ~400-700 KB (depending on which MLS impl). Acceptable for a tooling page; we will lazy-load.

---

## 5. Operational risks

| Risk | Mitigation |
|------|------------|
| AGPL contagion if OpenMLS chosen | Use `mls-rs` (Apache-2.0) instead, or scope the AGPL Worker to a P31-internal endpoint with no library distribution. |
| WASM size on slow connections | Lazy-load only when MLS is needed; cache aggressively at the edge. |
| DO storage cost as messages accumulate | TTL old encrypted blobs after delivery confirmation; ephemeral by default. |
| Crypto implementation bug | Phase 3 PEER-3 includes the third-party security audit (PEER-2B follow-up). MLS impl is in scope. |
| Member device loss → lost group state | Use the existing passkey + recovery pact for re-enrollment. New device gets a fresh KeyPackage and is re-Welcomed. Past messages remain unrecoverable (forward secrecy). |
| Children's devices on shared family hardware | Per-user passkey + per-user MLS identity; never share identities across siblings even on the same iPad. |
| Spam / abuse | Out of scope for family mesh (4 trusted members). Becomes real only if MLS is later extended to stranger-to-stranger; not a Phase 3 concern. |
| Standards drift (PQC variants) | Track the IETF MLS WG; revisit ciphersuite default annually. |

---

## 6. Phase 3 entry — what PEER-3A looks like

When this spike is approved and Phase 3 funding is in place:

1. **Pick the crate** — `mls-rs` baseline; reconsider OpenMLS only if needed.
2. **Build the WASM artifact** in `andromeda/04_SOFTWARE/mls-core/` (new crate). Output: `pkg/mls_core_bg.wasm` + JS bindings.
3. **Write the Worker** in `andromeda/04_SOFTWARE/k4-mls/` (new package). KV for KeyPackage cache. DO for group roster.
4. **Wire to the family hub** — start with operator self-hosted demo at `https://p31ca.org/family-broadcast` (passkey-gated). Children get the same page; their passkey identifies them in the cage roster.
5. **Ship the audit** (PEER-2B) before any human-readable message goes through it. Audit scope includes the WASM compile, the Worker, and the key handling in the browser.
6. **Update transparency report** to disclose the new product surface and re-attest §6 (data we don't collect).

---

## 7. What this spike consumed

- 1 agent-session reading RFC 9420 + the OpenMLS / mls-rs READMEs + the IETF MLS WG charter.
- 0 lines of Rust.
- 0 lines of WASM.
- 0 production cost.

This is a **decision document**, not a deployment. The deployment is Phase 3.

---

## 8. References

- **RFC 9420 — The Messaging Layer Security (MLS) Protocol** — https://www.rfc-editor.org/rfc/rfc9420
- **MLS Architecture (informational draft)** — https://datatracker.ietf.org/doc/draft-ietf-mls-architecture/
- **OpenMLS** — https://github.com/openmls/openmls (AGPL-3.0)
- **mls-rs** — https://github.com/awslabs/mls-rs (Apache-2.0)
- **MLSpp** — https://github.com/cisco/mlspp (BSD-2)
- **IETF MLS WG charter** — https://datatracker.ietf.org/wg/mls/about/

---

*Spike 1.0.0 — 2026-05-02. Companion to `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-2C. Operator must read and sign before Phase 3 PEER-3A begins.*
