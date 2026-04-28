## Final review checklist (production)

### Local (this repo)
- Repo root anchors exist:
  - `/home/p31/.zenodo.json`
  - `/home/p31/CITATION.cff`
- Internal inventory docs exist:
  - `/home/p31/cognitive_passport.md`
  - `/home/p31/god_ground_truth.md`
  - `/home/p31/traction_package.md`
- Scanner produces newest outputs with only external-action discrepancies:
  - `p31labs/out/zenodo_scan_*.json`
  - `p31labs/out/zenodo_scan_*.md`

### External (must be done on Zenodo/GitHub)
- Zenodo Paper I creator affiliation set to **“P31 Labs, Inc.”**
- Paper III DOI ambiguity resolved (distinct Zenodo record OR companion-only model)
- GitHub org page (`p31labs`) contains a Zenodo DOI badge (via `p31labs/.github` org-profile)

### Re-scan command (run from /home/p31)

```bash
cd /home/p31
python3 /home/p31/p31labs/scripts/zenodo_scan_local.py --mode full --output-format json+markdown
```

Expected all-green criteria:
- `discrepancies_found` is `0`
- GitHub surface is `✅` (contains `10.5281/zenodo`)
- Zenodo vector shows Paper I as `✅` (affiliation present)
- Paper III is either:
  - mapped to its own distinct Zenodo DOI, or
  - represented as companion in the inventory model without DOI conflict

