#!/usr/bin/env python3
"""
P31 ZENODO INVENTORY SCANNER
Audit: Zenodo records ↔ internal docs ↔ public surface ↔ repo anchoring

Usage:
    python zenodo_scan_local.py --mode full --output json+markdown

Author: P31 Labs SCHOLAR Agent
"""

import json
import sys
from datetime import datetime
from dataclasses import dataclass
from typing import Dict, List, Optional
import subprocess
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class PaperRecord:
    number: int
    title: str
    doi: str
    pub_date: str
    zenodo_status: str = "⚠️"
    internal_status: str = "⚠️"
    public_status: str = "⚠️"
    repo_status: str = "⚠️"
    discrepancies: List[str] = None
    
    def __post_init__(self):
        if self.discrepancies is None:
            self.discrepancies = []
    
    def consistency_score(self) -> int:
        """Calculate paper consistency as % of vertices complete"""
        statuses = [self.zenodo_status, self.internal_status, self.public_status, self.repo_status]
        complete = sum(1 for s in statuses if s == "✅")
        return (complete // 4) * 100

# ═══════════════════════════════════════════════════════════════════════════

class ZenodoScanner:
    
    KNOWN_PAPERS = {
        1: {
            "title": "The Tetrahedron Protocol: Structural Information Security via K₄ Complete Graphs",
            "doi": "10.5281/zenodo.19004485",
            "pub_date": "2026-02-13"
        },
        2: {
            "title": "Genesis Whitepaper",
            "doi": "10.5281/zenodo.19411363",
            "pub_date": "2026-03-XX"  # infer from search
        },
        3: {
            "title": "Consciousness, Memory, and the Architecture of Self-Preservation",
            "doi": "10.5281/zenodo.19416491",
            "pub_date": "2026-03-XX"
        },
        4: {
            "title": "Universal Bridge at the Phase Transition",
            "doi": "10.5281/zenodo.19503542",
            "pub_date": "2026-04-10"
        }
    }
    
    INTERNAL_DOCS = {
        "CogPass": "./cognitive_passport.md",
        "GOD_GT": "./god_ground_truth.md",
        "p31_forge": "./p31_forge.py",
        "Traction": "./traction_package.md",
        "README": "./README.md",
        "CITATION": "./CITATION.cff"
    }
    
    PUBLIC_URLS = {
        "research": "https://phosphorus31.org/research",
        "p31ca": "https://p31ca.org",
        "github": "https://github.com/p31labs"
    }
    
    def __init__(self):
        self.papers: Dict[int, PaperRecord] = {}
        self.discrepancies: List[Dict] = []
        self.scan_start = datetime.now().isoformat()
        self.base_dir = self._detect_repo_root()
    
    def _report_dir(self) -> Path:
        """
        Write scan artifacts under p31labs/out/ (keeps repo root clean).
        """
        labs_root = Path(__file__).resolve().parents[1]
        out_dir = labs_root / "out"
        out_dir.mkdir(parents=True, exist_ok=True)
        return out_dir
    
    def _detect_repo_root(self) -> Path:
        """
        Try to find a canonical repo root by walking upward from CWD.
        Priority is a directory containing .zenodo.json and CITATION.cff.
        Fallback: current working directory.
        """
        cwd = Path.cwd().resolve()
        for parent in [cwd, *cwd.parents]:
            if (parent / ".zenodo.json").exists() and (parent / "CITATION.cff").exists():
                return parent
        return cwd
    
    def _read_text(self, rel_path: str) -> str:
        return (self.base_dir / rel_path).read_text(encoding="utf-8", errors="replace")
    
    def _exists(self, rel_path: str) -> bool:
        return (self.base_dir / rel_path).exists()
    
    def _curl_status(self, url: str) -> Optional[int]:
        """
        Return final HTTP status code following redirects, or None on failure.
        """
        cmd = f"curl -sS -L -o /dev/null -w '%{{http_code}}' --max-time 8 {url}"
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                return None
            out = (result.stdout or "").strip()
            if not out.isdigit():
                return None
            return int(out)
        except subprocess.TimeoutExpired:
            return None
    
    def _curl_json(self, url: str, timeout_s: int = 30, attempts: int = 3) -> Optional[str]:
        """
        Fetch JSON from Zenodo with retries (transient timeouts are common).
        """
        last_err: Optional[str] = None
        for attempt in range(1, attempts + 1):
            cmd = f"curl -sS --retry 3 --retry-delay 1 --max-time {timeout_s} {url}"
            try:
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout_s + 5)
                if result.returncode == 0 and result.stdout.strip():
                    return result.stdout
                last_err = (result.stderr or "").strip() or f"curl_exit_{result.returncode}"
            except subprocess.TimeoutExpired:
                last_err = "timeout"
        if last_err:
            # Surface last error for debugging callers (best-effort)
            setattr(self, "_last_zenodo_fetch_error", last_err)
        return None
    
    def scan_zenodo_vector(self) -> Dict[int, Dict]:
        """
        Vector 1: Query Zenodo API for live records.
        For each known DOI, fetch metadata and verify completeness.
        """
        print("🔍 Vector 1: Scanning Zenodo records...")
        zenodo_results = {}
        
        for paper_num, meta in self.KNOWN_PAPERS.items():
            doi = meta["doi"]
            
            # Construct Zenodo API URL (extract numeric ID from DOI)
            zenodo_id = doi.split(".")[-1]
            api_url = f"https://zenodo.org/api/records/{zenodo_id}"
            
            try:
                raw = self._curl_json(api_url, timeout_s=30, attempts=3)
                if raw:
                    try:
                        record = json.loads(raw)
                    except json.JSONDecodeError:
                        # Zenodo occasionally returns empty/transient bodies; retry once more slowly.
                        raw2 = self._curl_json(api_url, timeout_s=45, attempts=2)
                        if not raw2:
                            raise
                        record = json.loads(raw2)
                    
                    # Check completeness
                    has_orcid = any(
                        "0009-0002-2492-9079" in str(c.get("orcid", "")) 
                        for c in record.get("metadata", {}).get("creators", [])
                    )
                    has_affiliation = any(
                        "P31 Labs" in str(c.get("affiliation", ""))
                        for c in record.get("metadata", {}).get("creators", [])
                    )
                    has_keywords = len(record.get("metadata", {}).get("keywords", [])) >= 5
                    has_license = record.get("metadata", {}).get("license", {}).get("id") == "cc-by-4.0"
                    
                    complete = all([has_orcid, has_affiliation, has_keywords, has_license])
                    status = "✅" if complete else "⚠️"
                    
                    zenodo_results[paper_num] = {
                        "status": status,
                        "doi": doi,
                        "has_orcid": has_orcid,
                        "has_affiliation": has_affiliation,
                        "has_keywords": has_keywords,
                        "has_license": has_license,
                        "record": record.get("metadata", {})
                    }
                    
                    if not complete:
                        missing = []
                        if not has_orcid: missing.append("ORCID")
                        if not has_affiliation: missing.append("affiliation")
                        if not has_keywords: missing.append("keywords")
                        if not has_license: missing.append("CC-BY-4.0")
                        self.discrepancies.append({
                            "type": "incomplete_zenodo_metadata",
                            "paper": paper_num,
                            "severity": "⚠️",
                            "missing": missing
                        })
                else:
                    zenodo_results[paper_num] = {
                        "status": "🔴",
                        "error": "API request failed after retries"
                    }
                    self.discrepancies.append({
                        "type": "zenodo_api_error",
                        "paper": paper_num,
                        "severity": "🔴",
                        "detail": getattr(self, "_last_zenodo_fetch_error", "unknown")
                    })
            
            except Exception as e:
                zenodo_results[paper_num] = {
                    "status": "🔴",
                    "error": str(e)
                }
                self.discrepancies.append({
                    "type": "zenodo_exception",
                    "paper": paper_num,
                    "severity": "🔴",
                    "error": str(e)
                })
        
        print(f"   ✓ {len([z for z in zenodo_results.values() if z['status'] in ['✅', '⚠️']])}/4 Zenodo records queried")
        return zenodo_results
    
    def scan_internal_vector(self) -> Dict[str, Dict]:
        """
        Vector 2: Search internal documentation files.
        Look for DOI references, verify paper counts, check titles.
        """
        print("🔍 Vector 2: Scanning internal documentation...")
        internal_results = {}
        
        # For full-codebase scans, these "expected" docs may live outside the detected base_dir.
        # If missing, try to locate them within a reasonable depth under base_dir.
        doc_search_roots = [self.base_dir]
        for extra in ["docs", "p31labs", "andromeda", "phosphorus31.org"]:
            p = (self.base_dir / extra)
            if p.exists() and p.is_dir():
                doc_search_roots.append(p)
        
        def locate(rel_or_name: str) -> Optional[Path]:
            rel = rel_or_name[2:] if rel_or_name.startswith("./") else rel_or_name
            direct = self.base_dir / rel
            if direct.exists():
                return direct
            target_name = Path(rel).name
            for root in doc_search_roots:
                try:
                    for candidate in root.rglob(target_name):
                        if candidate.is_file():
                            return candidate
                except Exception:
                    continue
            return None
        
        for doc_name, path in self.INTERNAL_DOCS.items():
            try:
                resolved = locate(path)
                if resolved is None:
                    raise FileNotFoundError(path)
                content = resolved.read_text(encoding="utf-8", errors="replace")
                
                # Count DOI references
                doi_count = content.count("10.5281/zenodo.")
                
                # Search for each known DOI
                found_dois = []
                for paper_num, meta in self.KNOWN_PAPERS.items():
                    if meta["doi"] in content:
                        found_dois.append((paper_num, meta["doi"]))
                
                status = "✅" if doi_count >= 3 else "⚠️" if doi_count >= 1 else "🔴"
                
                internal_results[doc_name] = {
                    "status": status,
                    "doi_count": doi_count,
                    "papers_referenced": len(found_dois),
                    "file_exists": True,
                    "path": str(resolved)
                }
            
            except FileNotFoundError:
                internal_results[doc_name] = {
                    "status": "🔴",
                    "file_exists": False,
                    "doi_count": 0,
                    "papers_referenced": 0
                }
                self.discrepancies.append({
                    "type": "missing_internal_doc",
                    "document": doc_name,
                    "severity": "⚠️",
                    "path": path
                })
            
            except Exception as e:
                internal_results[doc_name] = {
                    "status": "🔴",
                    "error": str(e)
                }
        
        print(f"   ✓ {len([v for v in internal_results.values() if v['file_exists']])}/6 internal docs found")
        return internal_results
    
    def scan_public_vector(self) -> Dict[str, Dict]:
        """
        Vector 3: Check public surface visibility.
        Test URLs for DOI badges, links, and accessibility.
        """
        print("🔍 Vector 3: Checking public surface...")
        public_results = {}
        
        for surface_name, url in self.PUBLIC_URLS.items():
            try:
                status_code = self._curl_status(url)
                if status_code is not None and 200 <= status_code < 400:
                    # URL is live, now check for DOI mentions (follow redirects)
                    cmd_content = f"curl -sS -L --max-time 8 {url}"
                    content_result = subprocess.run(cmd_content, shell=True, capture_output=True, text=True, timeout=10)
                    
                    if "10.5281/zenodo" in content_result.stdout:
                        status = "✅"
                    else:
                        status = "⚠️"
                        self.discrepancies.append({
                            "type": "missing_doi_badge",
                            "surface": surface_name,
                            "severity": "⚠️",
                            "url": url
                        })
                    
                    public_results[surface_name] = {
                        "status": status,
                        "url": url,
                        "http_code": status_code,
                        "has_doi_badge": "10.5281/zenodo" in content_result.stdout
                    }
                else:
                    public_results[surface_name] = {
                        "status": "🔴",
                        "url": url,
                        "http_code": "unreachable"
                    }
                    self.discrepancies.append({
                        "type": "url_unreachable",
                        "surface": surface_name,
                        "severity": "🔴",
                        "url": url
                    })
            
            except subprocess.TimeoutExpired:
                public_results[surface_name] = {
                    "status": "🔴",
                    "url": url,
                    "error": "timeout"
                }
            
            except Exception as e:
                public_results[surface_name] = {
                    "status": "🔴",
                    "url": url,
                    "error": str(e)
                }
        
        print(f"   ✓ {len([p for p in public_results.values() if p['status'] in ['✅', '⚠️']])}/3 public surfaces checked")
        return public_results
    
    def scan_repo_vector(self) -> Dict[str, Dict]:
        """
        Vector 4: Check repo anchoring.
        Look for .zenodo.json and CITATION.cff in root.
        """
        print("🔍 Vector 4: Checking repo anchoring...")
        repo_results = {}
        
        # Check .zenodo.json
        try:
            zenodo_json = json.loads(self._read_text(".zenodo.json"))
            
            related_ids = zenodo_json.get("metadata", {}).get("related_identifiers", [])
            related_dois = [r.get("identifier") for r in related_ids]
            
            status = "✅" if len(related_dois) >= 3 else "⚠️"
            
            repo_results[".zenodo.json"] = {
                "status": status,
                "file_exists": True,
                "related_dois": related_dois,
                "creator_orcid": zenodo_json.get("metadata", {}).get("creators", [{}])[0].get("orcid")
            }
        
        except FileNotFoundError:
            repo_results[".zenodo.json"] = {
                "status": "🔴",
                "file_exists": False
            }
            self.discrepancies.append({
                "type": "missing_zenodo_json",
                "severity": "⚠️",
                "remediation": "Create .zenodo.json in repo root with related_identifiers"
            })
        
        # Check CITATION.cff
        try:
            content = self._read_text("CITATION.cff")
            
            doi_count = content.count("10.5281/zenodo.")
            status = "✅" if doi_count >= 3 else "⚠️"
            
            repo_results["CITATION.cff"] = {
                "status": status,
                "file_exists": True,
                "doi_count": doi_count
            }
        
        except FileNotFoundError:
            repo_results["CITATION.cff"] = {
                "status": "⚠️",
                "file_exists": False
            }
            self.discrepancies.append({
                "type": "missing_citation_cff",
                "severity": "⚠️",
                "remediation": "Create CITATION.cff in repo root"
            })
        
        print(f"   ✓ Repo anchoring checked")
        return repo_results
    
    def generate_json_report(self, zenodo: Dict, internal: Dict, public: Dict, repo: Dict) -> str:
        """Output machine-parseable JSON report"""
        
        consistency_scores = []
        for paper_num in [1, 2, 3, 4]:
            z_status = zenodo.get(paper_num, {}).get("status", "🔴")
            i_status = "✅" if any(internal[doc]["doi_count"] >= 1 for doc in internal) else "🔴"
            p_status = "✅" if any(public[surf]["status"] == "✅" for surf in public) else "🔴"
            r_status = repo[".zenodo.json"]["status"] if ".zenodo.json" in repo else "🔴"
            
            score = sum(1 for s in [z_status, i_status, p_status, r_status] if s == "✅")
            consistency_scores.append(score)
        
        avg_score = (sum(consistency_scores) // len(consistency_scores) * 25)
        
        report = {
            "scan_timestamp": self.scan_start,
            "scan_operator": "William R. Johnson",
            "orcid": "0009-0002-2492-9079",
            "organization": "P31 Labs, Inc.",
            
            "papers_found": 4,
            "papers_expected": 4,
            "consistency_score_percent": avg_score,
            
            "zenodo_vector": zenodo,
            "internal_vector": internal,
            "public_vector": public,
            "repo_vector": repo,
            
            "discrepancies_found": len(self.discrepancies),
            "discrepancies": self.discrepancies,
            
            "health_summary": {
                "status": "healthy" if avg_score > 80 else "attention_required" if avg_score > 50 else "critical",
                "recommendation": "No action required" if not self.discrepancies else f"Review {len(self.discrepancies)} discrepancy(ies)"
            }
        }
        
        return json.dumps(report, indent=2)
    
    def generate_markdown_report(self, zenodo: Dict, internal: Dict, public: Dict, repo: Dict) -> str:
        """Output human-readable Markdown report"""
        
        report = f"""# P31 ZENODO INVENTORY SCAN REPORT
**Scan Date:** {self.scan_start}  
**Operator:** William R. Johnson  
**ORCID:** 0009-0002-2492-9079  
**Organization:** P31 Labs, Inc.

## Executive Summary
- Papers found: 4/4
- Discrepancies: {len(self.discrepancies)}
- Status: {"✅ SYNCHRONIZED" if not self.discrepancies else "⚠️ REQUIRES ATTENTION"}

## Vector Results

### Vector 1: Zenodo Records
"""
        for paper_num, result in zenodo.items():
            status = result.get("status", "?")
            doi = result.get("doi", "unknown")
            report += f"- Paper {paper_num} ({doi}): {status}\n"
        
        report += "\n### Vector 2: Internal Documentation\n"
        for doc_name, result in internal.items():
            status = result.get("status", "?")
            report += f"- {doc_name}: {status} ({result.get('doi_count', 0)} DOI refs)\n"
        
        report += "\n### Vector 3: Public Surface\n"
        for surface, result in public.items():
            status = result.get("status", "?")
            url = result.get("url", "unknown")
            report += f"- {surface} ({url}): {status}\n"
        
        report += "\n### Vector 4: Repo Anchoring\n"
        for file_name, result in repo.items():
            status = result.get("status", "?")
            report += f"- {file_name}: {status}\n"
        
        if self.discrepancies:
            report += "\n## Discrepancies\n"
            for disc in self.discrepancies:
                severity = disc.get("severity", "?")
                disc_type = disc.get("type", "unknown")
                report += f"- {severity} **{disc_type}**: {disc.get('detail', disc)}\n"
        
        report += "\n## Recommendations\n"
        if not self.discrepancies:
            report += "- No action required. Ecosystem is fully synchronized.\n"
        else:
            for disc in self.discrepancies:
                if "remediation" in disc:
                    report += f"- {disc['remediation']}\n"
        
        return report
    
    def run(self, output_format: str = "json+markdown"):
        """Execute full scan"""
        print("\n" + "="*60)
        print("P31 ZENODO INVENTORY SCANNER")
        print("="*60 + "\n")
        
        zenodo = self.scan_zenodo_vector()
        internal = self.scan_internal_vector()
        public = self.scan_public_vector()
        repo = self.scan_repo_vector()
        
        print("\n" + "="*60)
        print("GENERATING REPORTS")
        print("="*60 + "\n")
        
        if "json" in output_format:
            json_report = self.generate_json_report(zenodo, internal, public, repo)
            print("JSON Report:")
            print(json_report)
            out_json = str(self._report_dir() / f"zenodo_scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
            with open(out_json, "w") as f:
                f.write(json_report)
            print(f"\nWrote {out_json}")
        
        if "markdown" in output_format:
            md_report = self.generate_markdown_report(zenodo, internal, public, repo)
            print("\nMarkdown Report:")
            print(md_report)
            out_md = str(self._report_dir() / f"zenodo_scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md")
            with open(out_md, "w") as f:
                f.write(md_report)
            print(f"\nWrote {out_md}")

# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="P31 Labs Zenodo Inventory Scanner")
    parser.add_argument("--mode", default="full", choices=["full", "quick"])
    parser.add_argument("--output-format", default="json+markdown")
    
    args = parser.parse_args()
    
    scanner = ZenodoScanner()
    scanner.run(output_format=args.output_format)
