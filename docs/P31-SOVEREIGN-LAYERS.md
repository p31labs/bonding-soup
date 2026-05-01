# P31 sovereign stack — all layers

**Machine index:** [`p31-sovereign-layers.json`](../p31-sovereign-layers.json) (`p31.sovereignLayers/0.1.0`)  
**Verify:** `npm run verify:sovereign-layers`  
**On-chain package:** [`packages/p31-sovereign-chain`](../packages/p31-sovereign-chain/) (Foundry)

This document is the human map; the JSON is the canonical checklist for shipped vs partial vs planned.

## How the layers stack

| ID | Layer | Role |
|----|--------|------|
| **L1** | Edge compute & DO state | Latency, isolation, agents — Workers + SQLite DOs. |
| **L2** | EVM SMART suite | **S** `P31TransparencyAnchor`, **M** `P31ManifestRegistry`, **A** `P31AccessAllowlist`, **R** `P31ContentRoot`, **T** `P31TreasuryConfig` — see `/contract-builder` + `/p31-smart-evm.json`. |
| **L3** | EVM content roots | **R** `P31ContentRoot` — key → CID for IPFS/Arweave builds (part of SMART). |
| **L4** | HTTPS manifests | `p31-contract-registry`, `creator-economy`, hub static JSON. |
| **L5** | Passkey identity | `u_*` routing; proof-of-possession without ledger accounts. |
| **L6** | DIDs / VCs | Planned — DID documents, optional anchor via L2. |
| **L7** | Fiat payments | Stripe + donate flows; receipt hashes can use L2. |
| **L8** | On-chain treasury | Planned — USDC/Base + Safe; complements L7. |
| **L9** | Pinning | Partial — automate pin of hub `dist/`; store CID in L3. |
| **L10** | Multisig governance | Partial — move L3 owner + keys to Safe; attest in L4/L2. |
| **L11** | CR frontends | Planned — gateways + ENS `contenthash` → L3 CID. |
| **L12** | Indexing | Partial — explorers + event pipelines for L2/L3. |

## Operating rule

**Hybrid by design:** L1 stays the interaction plane; L2–L3 provide **tamper evidence** and **decentralized distribution**, not a full rewrite of mesh semantics. Full decentralization means **operating** L9–L11 after deploy, not only shipping Solidity.

## Related

- [`p31-chain-anchor.json`](../p31-chain-anchor.json) — contract addresses per network.  
- [`docs/RESEARCH-BRIEF-CRYPTOGRAPHIC-CONSCIOUSNESS-IDENTITY.md`](./RESEARCH-BRIEF-CRYPTOGRAPHIC-CONSCIOUSNESS-IDENTITY.md) — identity partition (L5/L6).  
- [`docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`](./P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md) — L4/L7 ethics + contracts.
