# NLnet NGI Zero Commons Fund — Grant Application
## P31 Labs, Inc. · k4 family mesh protocol

**Status:** Draft — submit at nlnet.nl before hard deadline  
**Fund:** NGI Zero Commons  
**Requested amount:** €15,000  
**Code repository:** https://github.com/p31labs/andromeda  
**Live endpoint:** https://k4-agent-hub.trimtab-signal.workers.dev/v1/manifest

---

## Project name

**k4 — open family mesh protocol for decentralized communication**

---

## Abstract (≤ 600 characters)

k4 is an open protocol for sovereign, decentralized family communication built on a complete-graph (K₄) topology. Four edge nodes — FORGE, COUNSEL, SCHOLAR, SCRIBE — form a tetrahedron. All communication is signed with Ed25519. No central server owns the mesh. The protocol includes a signed dock protocol, a federation dispatch layer for P2P hub routing, and a guardian-gated minor vertex activation scheme. The goal is a spec others can implement without depending on our infrastructure.

---

## Describe what the problem is that you want to solve

I built this because I needed it.

I'm AuDHD with hypoparathyroidism. Late diagnosis, 2025. I have two kids — ages 9 and 6 — in a custody situation that means communication with them goes through fragile, surveilled channels. The tools that exist for separated families are either surveillance-capitalism products (data harvested, behavioral profiles built, ads served around the pain of separation), expensive proprietary platforms, or designed for neurotypical workflows that assume verbal back-and-forth is easy.

None of those assumptions hold for me. Or for my kids.

So I built a communication mesh from a parking lot on I-95 in Camden County, Georgia, running on $0/month of serverless infrastructure. The constraint of zero budget forced me to design something that doesn't depend on a company staying solvent — it depends only on math, cryptography, and open protocol.

The deeper problem is this: every family communication tool that exists today routes your family's data through a company that has financial incentives to harvest it. There is no open-protocol alternative. Signal is close, but it's point-to-point — it has no concept of a "family mesh" where multiple vertices (people) share a shared state, a shared topology, and guaranteed delivery to a guardian-verified minor vertex.

k4 is my attempt to write that protocol. The implementation exists and is running in production. The specification — the document that would let someone else implement a compatible hub without depending on my code or my infrastructure — does not exist yet. That's what this grant would fund.

---

## Describe who will benefit and how

**Separated families** — parents who don't live with their children full-time. This is tens of millions of people globally. The current toolset (FaceTime, Google Meet, Zoom, Facebook) requires each family member to have an account with a surveillance-capitalism company, which creates identity and behavioral data profiles on children. k4's guardian-token gate for minor vertices means a child can be part of the mesh without holding a commercial account anywhere.

**Neurodivergent families** — families where one or more members has AuDHD, autism, ADHD, or other conditions that make standard communication interfaces high-friction. k4's structured skill dispatch (COUNSEL for relationship context, SCHOLAR for understanding, FORGE for making things together, SCRIBE for memory) maps to how neurodivergent communication actually works: you need context, you need patience, you need asynchronous options.

**Anyone building decentralized communication tools** — the open specification, once written, gives other developers a reference they can implement. The Ed25519 signed dock protocol and the K₄ topology invariants (four vertices, six edges, complete graph, no single point of failure) are generalizable. Someone building a healthcare communication mesh, a mutual aid network, or a legal advocacy communication system could use k4's protocol as a starting point.

---

## Describe the project

k4 is a running implementation of a family communication mesh. It is built on Cloudflare Workers and Durable Objects — a zero-cost, serverless, globally distributed edge platform. Four "hub" nodes form a K₄ complete graph (every node connects to every other node; no hierarchy):

- **FORGE** — making things together; code, build, scaffold
- **COUNSEL** — relationship context, legal record, emotional support
- **SCHOLAR** — understanding, pattern-recognition, research
- **SCRIBE** — memory, continuity, handover

The protocol surface is:

```
POST /v1/dock              — dock a client to the mesh (Ed25519 signed envelope)
POST /v1/{hub}/call        — invoke a skill (signed when session was signed-dock)
GET  /v1/topology          — K₄ adjacency map, hub statuses
POST /v1/federation/peer   — register a peer hub instance (signed)
POST /v1/federation/dispatch — P2P signed skill dispatch across hub instances
POST /v1/family/dock       — guardian-signed vertex activation for a minor
WS   /v1/{hub}/stream      — hibernatable WebSocket; broadcasts call events
```

All requests carry canonical pipe-delimited signed strings. The signing format is:

```
dock:       publicKey|ts|nonce|path
call:       publicKey|ts|nonce|hub|skillId
anchor-pact: publicKey|ts|nonce|pactId|payload
peer-dispatch: instanceId|ts|nonce|targetHub|skillId|payload
family-dock: operatorPublicKey|ts|nonce|vertexId|guardianToken
```

The specification document this grant would fund would formalize these canonical strings into a proper protocol specification: wire format, signing algorithm, nonce handling, replay protection window, federation peer registration handshake, and guardian-token derivation for minor vertex activation.

**What this grant funds:**

1. **Protocol specification document** — a proper RFC-style document describing the k4 wire protocol. Wire format, signing requirements, topology invariants, federation handshake, guardian-token gate. Enough for an independent developer to write a compatible implementation.

2. **Test vector suite** — canonical signing examples with known inputs and expected outputs. Anyone implementing the protocol can run their implementation against these vectors.

3. **Reference implementation cleanup** — the current implementation is production-running code built under time pressure. It works but has rough edges. Grant funds clean it up to the standard of a reference implementation people can learn from.

4. **Federation protocol hardening** — the peer discovery and P2P dispatch layer is currently one-hop. The spec would define multi-hop federation so multiple independent hub instances can form a larger mesh.

**Budget (€15,000):**

| Line | Hours | Rate | Amount |
|------|-------|------|--------|
| Protocol spec document (research + write) | 80h | €75/h | €6,000 |
| Test vector suite (design + implement) | 40h | €75/h | €3,000 |
| Reference implementation cleanup | 40h | €75/h | €3,000 |
| Federation protocol hardening | 20h | €75/h | €1,500 |
| Review, editing, publication | 20h | €75/h | €1,500 |
| **Total** | **200h** | | **€15,000** |

**Why €75/h:** This is below US market rate for the work (typically $120–$150/h). The operator is operating at $0 income pending FERS disability retirement determination. The grant funds the time to write something that benefits the commons.

---

## Describe any competing approaches

**Signal / Matrix / XMPP** — point-to-point or federated messaging. None have a family-mesh concept with guardian-gated minor vertices, K₄ topology, or skill-dispatch semantics. These are general messaging protocols; k4 is specifically about family context and neurodivergent communication structure.

**Proprietary family apps** (TalkingParents, OurFamilyWizard, coParenter) — designed for legal record-keeping in custody situations. They are surveillance products, not communication tools. They store and monetize the contents of family communication. They do not publish their protocols.

**ActivityPub / Fediverse** — federated social protocol. Not designed for private family mesh. No concept of guardian-gated minor participation. Activity streams model doesn't map to skill-dispatch.

k4 is the only protocol I'm aware of that defines: (a) a complete-graph topology invariant, (b) guardian-gated minor vertex activation with Ed25519 signing, (c) structured skill dispatch semantics, and (d) federation peer dispatch for multi-operator deployment. If I'm wrong and something exists, I'd be happy to contribute to it instead of writing a new spec.

---

## Eligibility note (check before submitting)

P31 Labs, Inc. is a US Georgia nonprofit. NGI Zero Commons has historically funded non-EU entities when the work produces a commons benefit. Confirm eligibility with NLnet contact before submitting. If a EU co-applicant is required, consider reaching out to a FOSS organization in the EU that works on decentralized communication (e.g., Matrix.org Foundation) about serving as a co-applicant.

---

## Links

- Live manifest: https://k4-agent-hub.trimtab-signal.workers.dev/v1/manifest
- Live topology: https://k4-agent-hub.trimtab-signal.workers.dev/v1/topology
- Public surface: https://p31ca.org/agents
- Entity: P31 Labs, Inc. · EIN 42-1888158 · Georgia nonprofit · 501(c)(3) pending
- SAM.gov UEI: NQKVWH6AKB58

---

## Applicant

William R. Johnson  
Operator, P31 Labs, Inc.  
will@p31ca.org  
(912) 227-4980
