/**
 * Rating Guide for Psychological E2E Testing
 * Grades user paths based on personality-specific criteria
 */

export const RATING_GUIDE = {
  EXCELLENT: {
    score: 90,
    label: "Excellent",
    color: "green",
    description: "Experience perfectly matched user needs and preferences",
  },
  GOOD: {
    score: 70,
    label: "Good",
    color: "lightgreen",
    description: "Experience mostly met user needs with minor issues",
  },
  FAIR: {
    score: 50,
    label: "Fair",
    color: "yellow",
    description: "Experience has notable issues for this personality type",
  },
  POOR: {
    score: 30,
    label: "Poor",
    color: "orange",
    description: "Experience has significant problems for this user type",
  },
  FAILED: {
    score: 0,
    label: "Failed",
    color: "red",
    description: "Experience is unusable for this personality type",
  },
};

export function calculateGrade(score) {
  if (score >= 90) return RATING_GUIDE.EXCELLENT;
  if (score >= 70) return RATING_GUIDE.GOOD;
  if (score >= 50) return RATING_GUIDE.FAIR;
  if (score >= 30) return RATING_GUIDE.POOR;
  return RATING_GUIDE.FAILED;
}

/**
 * Grade a path based on personality criteria
 */
export function gradePath(personality, observations, violations) {
  let score = 100;
  const deductions = [];
  const criteria = personality.criteria;

  // Check wait times
  if (criteria.maxWaitTime) {
    const slowLoads = observations.filter((o) => o.loadTime > criteria.maxWaitTime);
    if (slowLoads.length > 0) {
      const deduction = slowLoads.length * 10;
      score -= deduction;
      deductions.push({
        criterion: "maxWaitTime",
        deduction,
        detail: `${slowLoads.length} pages loaded slower than ${criteria.maxWaitTime}ms`,
      });
    }
  }

  // Check animation limits
  if (criteria.maxAnimations) {
    const highAnimPages = observations.filter((o) => o.animationCount > criteria.maxAnimations);
    if (highAnimPages.length > 0) {
      const deduction = highAnimPages.length * 15;
      score -= deduction;
      deductions.push({
        criterion: "maxAnimations",
        deduction,
        detail: `${highAnimPages.length} pages exceeded ${criteria.maxAnimations} animations`,
      });
    }
  }

  // Check reduced motion
  if (criteria.reducedMotionRequired) {
    const motionViolations = violations.filter((v) => v.type === "MOTION_VIOLATION");
    if (motionViolations.length > 0) {
      const deduction = motionViolations.length * 20;
      score -= deduction;
      deductions.push({
        criterion: "reducedMotionRequired",
        deduction,
        detail: `${motionViolations.length} reduced motion violations`,
      });
    }
  }

  // Check ARIA requirements
  if (criteria.ariaLabelsRequired) {
    const ariaViolations = violations.filter((v) => v.type === "ARIA_VIOLATION");
    if (ariaViolations.length > 0) {
      const deduction = ariaViolations.length * 10;
      score -= deduction;
      deductions.push({
        criterion: "ariaLabelsRequired",
        deduction,
        detail: `${ariaViolations.length} ARIA violations`,
      });
    }
  }

  // Check keyboard nav
  if (criteria.keyboardNavRequired) {
    const keyboardIssues = violations.filter(
      (v) => v.type === "ACCESSIBILITY" && v.message.includes("skip link")
    );
    if (keyboardIssues.length > 0) {
      score -= 15;
      deductions.push({
        criterion: "keyboardNavRequired",
        deduction: 15,
        detail: "Missing skip links for keyboard navigation",
      });
    }
  }

  // Check font size
  if (criteria.minFontSize) {
    const smallText = observations.filter((o) => o.smallestFontSize < criteria.minFontSize);
    if (smallText.length > 0) {
      score -= 10;
      deductions.push({
        criterion: "minFontSize",
        deduction: 10,
        detail: `${smallText.length} pages have text smaller than ${criteria.minFontSize}px`,
      });
    }
  }

  // Check for autoplay
  const autoplayViolations = violations.filter((v) => v.type === "AUTOPLAY_MEDIA");
  if (autoplayViolations.length > 0 && personality.traits.includes("sensory-sensitive")) {
    score -= autoplayViolations.length * 25;
    deductions.push({
      criterion: "autoplay",
      deduction: autoplayViolations.length * 25,
      detail: "Autoplay media detected (critical for sensory-sensitive users)",
    });
  }

  // Frustration triggers
  personality.frustrationTriggers.forEach((trigger) => {
    const matchingViolations = violations.filter((v) =>
      v.message.toLowerCase().includes(trigger.replace(/-/g, " "))
    );
    if (matchingViolations.length > 0) {
      const deduction = 10;
      score -= deduction;
      deductions.push({
        criterion: "frustrationTrigger",
        deduction,
        detail: `Frustration trigger hit: ${trigger}`,
      });
    }
  });

  score = Math.max(0, score);
  const grade = calculateGrade(score);

  return {
    score,
    grade,
    deductions,
    personalityName: personality.name,
    summary: `${personality.name}: ${grade.label} (${score}/100) - ${grade.description}`,
  };
}

export function generateRatingReport(results) {
  const byPersonality = {};
  const allGrades = [];

  results.forEach((r) => {
    if (!r) return;
    const personalityName = r.personalityName || r.personality?.name || "Unknown";
    if (!byPersonality[personalityName]) {
      byPersonality[personalityName] = [];
    }
    byPersonality[personalityName].push(r);
    allGrades.push(r.score);
  });

  const report = {
    summary: {
      totalPaths: results.length,
      averageScore: allGrades.reduce((a, b) => a + b, 0) / allGrades.length,
      byGrade: {},
    },
    byPersonality,
  };

  Object.values(RATING_GUIDE).forEach((grade) => {
    report.summary.byGrade[grade.label] = allGrades.filter(
      (s) => calculateGrade(s) === grade
    ).length;
  });

  return report;
}
