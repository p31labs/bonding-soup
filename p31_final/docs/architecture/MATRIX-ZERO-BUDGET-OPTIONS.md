# Matrix Zero-Budget Alternatives (CWP-SOV-06)

## Overview
This document evaluates zero-budget ($0/mo) hosting solutions for a Matrix server to support secure, private communication for the P31 ecosystem.

## Hosting Alternatives

| Solution | Resources | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Conduit (Self-hosted)** | Low (Rust) | Lightweight, single binary | Requires dedicated machine/Pi |
| **Oracle Cloud Free Tier** | High (4x ARM vCPUs) | Powerful, free forever | Complex setup, account risk |
| **Cloudflare Workers (Pseudo-relay)** | N/A | Serverless, fast | Not full Matrix; architectural challenge |

## Recommendation
- **Primary:** **Conduit** running on existing local hardware (Raspberry Pi/similar) is the most sustainable, privacy-respecting choice for a zero-budget requirement.
- **Secondary:** **Oracle Cloud Free Tier** provides the best compute resources if cloud-hosting is required for high availability.

## Next Steps
- Assess existing local hardware capacity for hosting a Conduit instance.
- Develop a deployment script for automated local setup.
