# SIC-POVM — mathematical appendix (rigorous)

**Scope:** Quantum-information definitions and the **d = 2** construction behind the “1/3” figure in [SIC-POVM-K4-ARCHITECTURE.md](SIC-POVM-K4-ARCHITECTURE.md). **Not** product medical claims, not legal doctrine, not a substitute for domain experts in cryptography or metrology.

**Relation to P31 repos:** Product copy and CI still treat Larmor / egg-hunt numbers per **`p31-constants.json`** and **`verify:egg-hunt`**. This file is **reference only** for why the metaphor names “four outcomes” and “1/3 overlap.”

---

## 1. Hilbert space and operators

Let \(\mathcal{H} \cong \mathbb{C}^d\) with \(\dim \mathcal{H} = d\). Let \(\mathcal{B}(\mathcal{H})\) be bounded operators, \(\mathrm{Herm}(\mathcal{H})\) Hermitian operators, and \(\mathrm{PSD}(\mathcal{H})\) positive semidefinite operators. The trace inner product (Hilbert–Schmidt) is

\[
\langle A, B \rangle_{\mathrm{HS}} := \mathrm{Tr}(A^\dagger B).
\]

A **density operator** \(\rho\) is PSD with \(\mathrm{Tr}\,\rho = 1\).

---

## 2. POVM (general)

A **positive operator-valued measure** (POVM) on a **finite** outcome set \(\{1,\dots,m\}\) is a tuple \((E_1,\dots,E_m)\) with:

1. \(E_k \in \mathrm{PSD}(\mathcal{H})\) for all \(k\);
2. \(\sum_{k=1}^m E_k = I\) (resolution of the identity).

**Born rule:** for initial state \(\rho\), outcome \(k\) has probability \(p_k = \mathrm{Tr}(E_k \rho)\). Non-negativity and normalization follow from PSD and \(\sum E_k = I\).

---

## 3. Rank-one, equal-trace POVM

Assume \(E_k = w_k \, |\psi_k\rangle\langle\psi_k|\) with unit vectors \(|\psi_k\rangle\) and weights \(w_k > 0\). If all ranks are one and traces equal,

\[
\mathrm{Tr}\,E_k = w_k = \frac{1}{m} \sum_j \mathrm{Tr}\,E_j = \frac{\mathrm{Tr}\,I}{m} = \frac{d}{m}.
\]

For a **maximal** POVM with \(m = d^2\) outcomes (the SIC setting), \(\mathrm{Tr}\,E_k = d/d^2 = 1/d\), hence

\[
E_k = \frac{1}{d}\, |\psi_k\rangle\langle\psi_k|.
\]

---

## 4. SIC-POVM — axiomatic definition

A **symmetric informationally complete** POVM (SIC-POVM) in dimension \(d\) is a POVM \(\{E_k\}_{k=1}^{d^2}\) such that:

**(S)** **Symmetric overlaps (Hilbert–Schmidt):** there exist constants \(a, b \in \mathbb{R}\) with

\[
\mathrm{Tr}(E_j E_k) = a\, \delta_{jk} + b\, (1 - \delta_{jk}).
\]

Equivalently, the Gram matrix \(G_{jk} = \mathrm{Tr}(E_j E_k)\) is **constant on the diagonal** and **constant off the diagonal**.

**(IC)** **Informational completeness:** the operators \(\{E_k\}\) **span** \(\mathcal{B}(\mathcal{H})\) as a complex vector space. Then the linear map \(\Phi: \rho \mapsto (\mathrm{Tr}(E_1\rho),\dots,\mathrm{Tr}(E_{d^2}\rho))\) determines \(\rho\) uniquely — tomography is possible from outcome statistics alone (in the ideal, noise-free limit).

Together with rank-one equal trace (§3), one obtains the standard **pure-state overlap** condition (Renes–Blume-Kohout–Scott–Caves, *J. Math. Phys.* **45** (2004), Sec. II): for the unit vectors \(|\psi_k\rangle\) in \(E_k = \frac{1}{d}|\psi_k\rangle\langle\psi_k|\),

\[
|\langle \psi_j | \psi_k \rangle|^2 = \frac{1}{d+1}, \qquad j \neq k.
\]

For **\(d = 2\)** (one qubit), \(|\langle \psi_j | \psi_k \rangle|^2 = \frac{1}{3}\) for all distinct pairs — this is the **“1/3”** figure used in the engineering map **as metaphor** for balanced four-way tension, not as a literal constant in application code.

---

## 5. Qubit \((d = 2)\): tetrahedron on the Bloch sphere

Identify pure states \(|\psi\rangle\) with unit Bloch vectors \(\mathbf{u} \in S^2 \subset \mathbb{R}^3\) via

\[
\rho = |\psi\rangle\langle\psi| = \frac{1}{2}\bigl(I + \mathbf{u}\cdot\boldsymbol{\sigma}\bigr),
\]

where \(\boldsymbol{\sigma} = (\sigma_x,\sigma_y,\sigma_z)\) are Pauli matrices. For two pure states with Bloch vectors \(\mathbf{u}, \mathbf{v}\),

\[
|\langle \psi_{\mathbf{u}} | \psi_{\mathbf{v}} \rangle|^2 = \frac{1 + \mathbf{u}\cdot\mathbf{v}}{2}.
\]

Imposing \(|\langle \psi_j | \psi_k \rangle|^2 = 1/3\) for all \(j \neq k\) gives

\[
\mathbf{u}_j \cdot \mathbf{u}_k = -\frac{1}{3}, \qquad j \neq k.
\]

Four unit vectors in \(\mathbb{R}^3\) with equal pairwise dot product \(-1/3\) are exactly the **vertices of a regular tetrahedron inscribed in** \(S^2\) (unique up to rotation). That is the **geometric** meaning of “four SIC outcomes” in **d = 2**: not the family graph \(K_4\) as a literal quantum object, but the **same combinatorial count** (four vertices) as the **tetrahedral** symmetry of the qubit SIC.

---

## 6. Informational completeness (dimension count)

\(\dim_{\mathbb{C}} \mathcal{B}(\mathcal{H}) = d^2\). A linearly independent set of \(d^2\) operators in \(\mathrm{Herm}(\mathcal{H})\) spans \(\mathrm{Herm}(\mathcal{H})\); adding \(i\) spans \(\mathcal{B}(\mathcal{H})\). The SIC \(\{E_k\}\) (indeed any full-rank linearly independent POVM of size \(d^2\)) can therefore span operator space — the **IC** in SIC.

---

## 7. Existence and scope (honest)

SIC-POVMs are **proven** to exist in **d = 2** (explicit construction above) and in **d = 3** (hand-built). For higher \(d\), existence is a **major open problem** in general; many dimensions have **numerical** solutions (Zauner conjecture, Heisenberg–Weyl orbit). **P31 product narrative must not** claim “SIC exists in all dimensions” or attach regulatory weight to open conjectures.

---

## 8. P31 engineering map (contract)

| Layer | Mathematical object (this appendix) | P31 repo role |
|-------|-------------------------------------|---------------|
| Four outcomes (d = 2) | Four rank-one POVM elements | Metaphor for **four design axes** in [SIC-POVM-K4-ARCHITECTURE.md](SIC-POVM-K4-ARCHITECTURE.md) |
| Overlap 1/3 | \(|\langle\psi_j|\psi_k\rangle|^2\) for \(j\neq k\) | **Narrative** “balanced coupling” — **not** a required constant in Workers, KV, or TLS |
| \(K_4\) graph | 4 vertices, 6 edges | **Family mesh / cage** story in mesh docs — **orthogonal** to whether you implement a literal 4-outcome quantum instrument |
| Larmor / 31P | Experimental NMR physics (outside this appendix) | **Only** where **`p31-constants.json`** + **`verify:egg-hunt`** say so |

---

## 9. Further reading (external, canonical QI)

- E. B. Davies, *Quantum Theory of Open Systems* — POVM foundations.
- J. M. Renes, R. Blume-Kohout, A. J. Scott, C. M. Caves, *Symmetric informationally complete quantum measurements*, J. Math. Phys. **45**, 2171–2180 (2004).
- G. Zauner, *Quantendesigns — Grundzüge einer nichtkommutativen Designtheorie* (Ph.D. thesis, 1999) — SIC existence / structure conjecture.

---

**Cross-links:** [SIC-POVM-K4-ARCHITECTURE.md](SIC-POVM-K4-ARCHITECTURE.md) · [EGG-HUNT.md](EGG-HUNT.md) · [SOULSAFE-TETRA-SPEC.md](SOULSAFE-TETRA-SPEC.md) · [PLAN-QUANTUM-CLOCK.md](PLAN-QUANTUM-CLOCK.md) (Larmor as pedagogical coherence, not clinical metrology).
