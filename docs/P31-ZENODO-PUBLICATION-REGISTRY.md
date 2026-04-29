# P31 Zenodo publication registry

**Author:** Johnson, William R. · **ORCID:** 0009-0002-2492-9079  
**Machine source:** `p31-constants.json` → `research` (counts, DOIs, titles, dates).  
**Last aligned:** 2026-04-28 (verified against Zenodo API: `q=creators.name:"Johnson, William R."` → **22** records).

## Counts

| Metric | Value |
|--------|------:|
| Zenodo publications (total) | **22** |
| P31 Research Series (Papers I–XX) | **20** |
| Standalone (legal / public interest, not series-numbered) | **2** |
| Paper XII (Sovereign Stack) | **Published** — not gated |

Older prose that said “4 papers,” “5 DOIs,” or “Paper XII gated” is obsolete.

## Series (I–XX)

| Series | DOI | Publication date (Zenodo) |
|--------|-----|---------------------------|
| I | 10.5281/zenodo.19004485 | 2026-01-26 |
| II | 10.5281/zenodo.19411363 | 2026-04-04 |
| III | 10.5281/zenodo.19416491 | 2026-04-04 |
| IV | 10.5281/zenodo.19503542 | 2026-04-10 |
| V | 10.5281/zenodo.19782977 | 2026-04-26 |
| VI | 10.5281/zenodo.19782979 | 2026-04-26 |
| VII | 10.5281/zenodo.19782981 | 2026-04-26 |
| VIII | 10.5281/zenodo.19782983 | 2026-04-26 |
| IX | 10.5281/zenodo.19782985 | 2026-04-26 |
| X | 10.5281/zenodo.19782987 | 2026-04-26 |
| XI | 10.5281/zenodo.19782971 | 2026-04-26 |
| XII | 10.5281/zenodo.19782969 | 2026-04-26 |
| XIII | 10.5281/zenodo.19782989 | 2026-04-26 |
| XIV | 10.5281/zenodo.19782991 | 2026-04-26 |
| XV | 10.5281/zenodo.19782993 | 2026-04-26 |
| XVI | 10.5281/zenodo.19782995 | 2026-04-26 |
| XVII | 10.5281/zenodo.19782997 | 2026-04-26 |
| XVIII | 10.5281/zenodo.19782999 | 2026-04-26 |
| XIX | 10.5281/zenodo.19782973 | 2026-04-26 |
| XX | 10.5281/zenodo.19783001 | 2026-04-26 |

Full titles are in `p31-constants.json` → `research.papers`.

## Standalone

| DOI | Publication date |
|-----|------------------|
| 10.5281/zenodo.19432309 | 2026-04-05 |
| 10.5281/zenodo.19432313 | 2026-04-05 |

## Discovery

- Zenodo search (same creator filter): https://zenodo.org/search?q=creators.name:%22Johnson%2C%20William%20R.%22&l=list&p=1&s=25&sort=newest  
- API (batch): `curl -G https://zenodo.org/api/records --data-urlencode 'q=creators.name:"Johnson, William R."' --data-urlencode size=25`

## Legal / strategy note

Standalone papers and some series papers (e.g. Camden County, procedural themes) are public under the operator’s name. Counsel should decide how citations interact with active litigation; grants can still cite the technical series broadly.
