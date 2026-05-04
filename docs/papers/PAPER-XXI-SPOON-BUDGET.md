# Paper XXI: The Spoon Budget Algorithm
## Algorithmic Resource Management for Neurodivergent Operators

**Author:** William R. Johnson, P31 Labs, Inc.  
**ORCID:** 0009-0002-2492-9079  
**Date:** May 4, 2026  
**DOI:** [Pending Zenodo deposit]  
**Series:** P31 Research Series XXI  
**Schema:** p31.paper/1.0.0

---

## Abstract

Traditional productivity systems assume infinite cognitive and metabolic resources. For neurodivergent operators managing conditions such as Autism Spectrum Disorder (ASD), Attention-Deficit/Hyperactivity Disorder (ADHD), and chronic physiological conditions, this assumption is not merely inaccurate—it is dangerous. This paper introduces the **Spoon Budget Algorithm**, a quantitative resource management system that treats cognitive and metabolic energy as a finite, measurable currency. The algorithm incorporates a Proportional-Integral-Derivative (PID) controller for expenditure damping, a progressive disclosure user interface that enforces access restrictions based on real-time resource availability, and a formal borrowing penalty system to prevent systemic collapse. We present the mathematical foundations, implementation architecture, and operational protocols for deploying the Spoon Budget in personal infrastructure management systems.

---

## 1. Introduction: The Resource Crisis

Conventional productivity frameworks—ranging from GTD (Getting Things Done) to Kanban—share a common flaw: they assume the operator possesses consistent, predictable access to executive function and metabolic stability. For neurodivergent operators, this assumption collapses. An AuDHD operator may experience hyperfocus states yielding 10x neurotypical output, followed by complete cognitive shutdown. An operator with hypoparathyroidism may face acute metabolic crises that render complex decision-making physiologically impossible.

The Spoon Budget Algorithm addresses this by treating energy as a **formal budget**—a measurable, bounded resource that must be allocated, tracked, and conserved.

---

## 2. Mathematical Foundations

### 2.1 The Budget Equation

The fundamental Spoon Budget ($S$) is defined as:

$$S = S_{\text{base}} - \sum_{i=1}^{n} c_i - p_{\text{borrowed}}$$

Where:
- $S_{\text{base}}$ = daily baseline budget (default: 12 units)
- $c_i$ = cost of task $i$ (in spoon units)
- $p_{\text{borrowed}}$ = penalty from previous day's borrowing

### 2.2 The Thermal Shutdown Threshold

System safety requires a hard lower bound. When $S \leq 2$, the system enters **Thermal Shutdown**:

```
IF S ≤ 2 THEN
  STATE = "BREATHE"
  UI = restricted
  WORKFLOWS = blocked
  ALERT = "Critical energy depletion"
```

This prevents the physiological destabilization that occurs when an operator attempts high-cognitive-load tasks with insufficient metabolic reserves.

### 2.3 The PID Controller (Samson V2)

To prevent oscillation between overwork and collapse, the system implements a **Proportional-Integral-Derivative (PID) controller** that analyzes the *velocity* of energy expenditure:

$$u(t) = K_p e(t) + K_i \int_0^t e(\tau) d\tau + K_d \frac{de(t)}{dt}$$

Where:
- $u(t)$ = control output (UI restriction level)
- $e(t)$ = error (deviation from target budget trajectory)
- $K_p$, $K_i$, $K_d$ = tuning parameters

The derivative term $\frac{de}{dt}$ is critical: if the system detects rapid budget depletion, it can **preemptively** restrict access before the operator reaches the thermal shutdown threshold.

### 2.4 The Borrowing Penalty

Human psychology tends to discount future costs. The Spoon Budget enforces a **1.5x borrowing penalty**:

$$p_{\text{borrowed}} = 1.5 \times \max(0, -S_{\text{previous}})$$

If an operator exhausts their budget (reaches $S \leq 0$), the next day's baseline is reduced by 150% of the overdraw amount. This creates mathematical pressure against unsustainable work patterns.

---

## 3. The Progressive Disclosure UI

The Spoon Budget enforces energy conservation through **progressive disclosure**—a UI pattern that dynamically reveals or conceals functionality based on real-time resource availability.

### 3.1 Layer Definitions

| Layer | Energy Range | UI State | Access Level |
|-------|-------------|----------|--------------|
| **BREATHE** | $S \leq 3$ | Minimal | Survival only: breathing pacers, emergency contacts |
| **FOCUS** | $4 \leq S \leq 6$ | Filtered | Priority queue only, no deep work |
| **BUILD** | $7 \leq S \leq 9$ | Standard | Full data feeds, deep work permitted |
| **COMMAND** | $S \geq 10$ | Complete | System-wide observability, overrides unlocked |

### 3.2 Implementation: Conditional Formatting

The layer state is computed via cascading conditional formulas. In Google Sheets:

```
=IF(B9<=3, "🔴 BREATHE", 
  IF(B9<=6, "🟡 FOCUS", 
    IF(B9<=9, "🟢 BUILD", 
      "🔵 COMMAND")))
```

This formula acts as the **central pacing mechanism** for the entire operational framework.

### 3.3 Visual Cues

The system employs widespread visual signaling:
- **Tab headers** manually greyed out in restricted states
- **Progress bars** showing budget depletion velocity
- **Color coding** (red/yellow/green/blue) for immediate state recognition
- **Animation** (gentle pulse on critical alerts)

---

## 4. System Architecture

### 4.1 Input Layer

The operator records energy expenditures as discrete events:

```json
{
  "timestamp": "2026-05-04T14:30:00Z",
  "task": "legal document review",
  "cost": 3,
  "layer_required": "BUILD",
  "actual_layer": "FOCUS"
}
```

### 4.2 Processing Layer

The **Samson V2 Controller** processes inputs:
1. Calculates current budget $S$
2. Computes PID control output $u(t)$
3. Determines UI layer state
4. Triggers alerts if thresholds crossed

### 4.3 Output Layer

The system generates:
- **Real-time budget display** (current $S$, velocity, trajectory)
- **Layer-appropriate UI** (progressive disclosure)
- **Predictive warnings** ("At current velocity, you will reach BREATHE in 2 hours")
- **Post-hoc reports** (daily budget efficiency, borrowing events)

---

## 5. Operational Protocols

### 5.1 The Stand Down Rule

When $S \leq 0$, **all work operations are structurally prohibited**. The system enforces this through:
- UI lockout of work tabs
- Automated calendar blocking
- Alert escalation to designated contacts

### 5.2 Exogenous Stress Events

High-stress external events (legal appearances, adversarial communications) trigger automatic algorithmic downgrade:

```
ON EVENT high_stress:
  IF current_layer == "COMMAND" THEN
    DOWNGRADE_TO = "BUILD"
  ELIF current_layer == "BUILD" THEN
    DOWNGRADE_TO = "FOCUS"
```

This prevents the operator from attempting complex work during acute stress.

### 5.3 Recovery Protocols

Post-depletion recovery follows exponential decay:

$$S_{\text{recovery}}(t) = S_{\text{max}} \times (1 - e^{-t/\tau})$$

Where $\tau$ = recovery time constant (typically 24-48 hours for severe depletion).

---

## 6. Integration with Personal Infrastructure

The Spoon Budget Algorithm is designed to integrate with broader personal infrastructure management:

- **K₄ Coherence Matrix**: Spoon Budget feeds into systemic health scoring
- **Task Management**: Budget-aware prioritization (high-cost tasks scheduled for high-energy periods)
- **Communication**: Auto-responses triggered by layer state ("I am in FOCUS mode; expect delayed responses")
- **Hardware Integration**: Haptic feedback for budget thresholds (e.g., Node One device at 863Hz)

---

## 7. Discussion

### 7.1 Limitations

The Spoon Budget Algorithm assumes honest self-reporting. Gaming the system (under-reporting costs, ignoring layer restrictions) leads to the same physiological consequences as ignoring any health protocol—system collapse.

### 7.2 Extensions

Future work includes:
- **Machine learning cost prediction** (estimating task costs based on historical data)
- **Biometric integration** (heart rate variability, sleep quality as budget inputs)
- **Social Spoon Budgets** (coordinating budgets across family units)

### 7.3 Ethical Considerations

The algorithm encodes a value judgment: **sustainable operation over maximum output**. This may conflict with capitalist productivity expectations. The 1.5x borrowing penalty is intentionally punitive to prevent exploitation.

---

## 8. Conclusion

The Spoon Budget Algorithm provides a formal, mathematical framework for cognitive and metabolic resource management. By treating energy as a finite currency, implementing PID control for expenditure damping, and enforcing progressive disclosure UI patterns, the system prevents the cyclical collapse common in unmanaged neurodivergent operation.

The algorithm is not merely a productivity tool—it is a **safety system** designed to keep the operator within physiological bounds while maximizing meaningful output.

---

## References

1. Miserandino, C. (2003). The Spoon Theory. But You Don't Look Sick.
2. Åström, K. J., & Hägglund, T. (2006). Advanced PID Control. ISA.
3. Johnson, W. R. (2026). Paper XX: The Trimtab Declaration. P31 Research Series. DOI: 10.5281/zenodo.19783001
4. P31 Labs. (2026). p31-universal-canon.json (Design Tokens v1.2.0).

---

## Implementation

Open-source implementation available at:  
**Repository:** `github.com/p31labs/spoon-budget`  
**License:** MIT  
**Template:** Google Sheets + Apps Script

---

**Cite as:**  
Johnson, W. R. (2026). *The Spoon Budget Algorithm: Algorithmic Resource Management for Neurodivergent Operators*. P31 Research Series XXI. P31 Labs, Inc. DOI: [pending]
