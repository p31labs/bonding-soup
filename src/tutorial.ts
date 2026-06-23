/**
 * BONDING Tutorial System
 * Interactive guide for new users to understand the molecular ecosystem
 */

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlightElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
  condition?: () => boolean;
  nextStep?: string;
}

export class TutorialSystem {
  private currentStep: TutorialStep | null = null;
  private completedSteps = new Set<string>();
  private isActive = false;
  private overlayElement: HTMLElement | null = null;
  private tooltipElement: HTMLElement | null = null;

  private steps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to BONDING',
      description: 'Welcome to The Soup! This is a molecular ecosystem where emotions manifest as chemistry. Click "Next" to learn about the different elements.',
      position: 'center',
      nextStep: 'molecules'
    },
    {
      id: 'molecules',
      title: 'Understanding Molecules',
      description: 'These are your molecules - each with unique personalities and emotional states. The colored circles represent different atoms, and the lines show chemical bonds.',
      position: 'top',
      highlightElement: '.molecule',
      nextStep: 'personalities'
    },
    {
      id: 'personalities',
      title: 'Molecular Personalities',
      description: 'Each molecule has a personality that affects its behavior. Look for the different movement patterns - some orbit others, some move erratically, others stay still like emotional anchors.',
      position: 'bottom',
      nextStep: 'ghosts'
    },
    {
      id: 'ghosts',
      title: 'Ghost Molecules (Multiplayer)',
      description: 'The semi-transparent molecules with dashed borders are from other players! They move smoothly thanks to our interpolation system. Try sending a ping to interact.',
      position: 'right',
      highlightElement: '.ghost-molecule',
      nextStep: 'reactions'
    },
    {
      id: 'reactions',
      title: 'Chemical Reactions',
      description: 'When molecules collide in compatible ways, they undergo reactions! Watch for particle effects - these represent emotional events like "falling in love" or conflict resolution.',
      position: 'left',
      nextStep: 'zones'
    },
    {
      id: 'zones',
      title: 'Atmospheric Zones',
      description: 'The Soup has different zones with unique atmospheres. The Calm Zone pulses with breathing rhythm, while The Deep has a mysterious resonance. Each affects molecular behavior differently.',
      position: 'top',
      nextStep: 'social'
    },
    {
      id: 'social',
      title: 'Social Interactions',
      description: 'Use the Exhibit A panel to see social events and ping other players\' molecules. Your interactions create lasting connections in the molecular ecosystem!',
      position: 'bottom',
      nextStep: 'complete'
    },
    {
      id: 'complete',
      title: 'Ready to Explore!',
      description: 'You\'re all set to explore The Soup! Remember: emotions are molecular, and regulation is chemistry. Enjoy your journey through the affective ecosystem.',
      position: 'center'
    }
  ];

  constructor() {
    this.createOverlayElements();
    this.loadProgress();
  }

  /**
   * Create the tutorial overlay elements
   */
  private createOverlayElements(): void {
    // Main overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'tutorial-overlay';
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: none;
      pointer-events: none;
    `;

    // Tooltip container
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.id = 'tutorial-tooltip';
    this.tooltipElement.style.cssText = `
      position: absolute;
      background: rgba(26, 26, 42, 0.95);
      border: 2px solid #4a90e2;
      border-radius: 8px;
      padding: 20px;
      max-width: 300px;
      font-family: monospace;
      font-size: 14px;
      color: #ffffff;
      z-index: 10001;
      pointer-events: auto;
      box-shadow: 0 4px 20px rgba(74, 144, 226, 0.3);
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      color: #ffffff;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
    `;
    closeBtn.onclick = () => this.endTutorial();

    // Content container
    const content = document.createElement('div');
    content.id = 'tutorial-content';

    const title = document.createElement('h3');
    title.id = 'tutorial-title';
    title.style.cssText = `
      margin: 0 0 10px 0;
      color: #4a90e2;
      font-size: 16px;
    `;

    const description = document.createElement('p');
    description.id = 'tutorial-description';
    description.style.cssText = `
      margin: 0 0 15px 0;
      line-height: 1.4;
    `;

    const buttons = document.createElement('div');
    buttons.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    `;

    const prevBtn = document.createElement('button');
    prevBtn.id = 'tutorial-prev';
    prevBtn.textContent = 'Previous';
    prevBtn.style.cssText = `
      padding: 8px 16px;
      background: #666;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-family: monospace;
    `;
    prevBtn.onclick = () => this.previousStep();

    const nextBtn = document.createElement('button');
    nextBtn.id = 'tutorial-next';
    nextBtn.textContent = 'Next';
    nextBtn.style.cssText = `
      padding: 8px 16px;
      background: #4a90e2;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-family: monospace;
    `;
    nextBtn.onclick = () => this.nextStep();

    buttons.appendChild(prevBtn);
    buttons.appendChild(nextBtn);

    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(buttons);

    this.tooltipElement.appendChild(closeBtn);
    this.tooltipElement.appendChild(content);

    document.body.appendChild(this.overlayElement);
    document.body.appendChild(this.tooltipElement);
  }

  /**
   * Start the tutorial
   */
  startTutorial(): void {
    this.isActive = true;
    this.overlayElement!.style.display = 'block';
    this.showStep('welcome');
  }

  /**
   * End the tutorial
   */
  endTutorial(): void {
    this.isActive = false;
    this.overlayElement!.style.display = 'none';
    this.tooltipElement!.style.display = 'none';
    this.currentStep = null;
  }

  /**
   * Show a specific tutorial step
   */
  private showStep(stepId: string): void {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return;

    this.currentStep = step;

    // Update tooltip content
    const titleEl = document.getElementById('tutorial-title')!;
    const descEl = document.getElementById('tutorial-description')!;
    const prevBtn = document.getElementById('tutorial-prev')!;
    const nextBtn = document.getElementById('tutorial-next')!;

    titleEl.textContent = step.title;
    descEl.textContent = step.description;

    // Update button states
    const prevStep = this.steps.find(s => s.nextStep === stepId);
    prevBtn.style.display = prevStep ? 'block' : 'none';
    nextBtn.textContent = step.id === 'complete' ? 'Finish' : 'Next';

    // Position tooltip
    this.positionTooltip(step);

    // Show tooltip
    this.tooltipElement!.style.display = 'block';

    // Execute step action if any
    if (step.action) {
      step.action();
    }
  }

  /**
   * Position the tooltip based on step configuration
   */
  private positionTooltip(step: TutorialStep): void {
    const tooltip = this.tooltipElement!;
    const rect = tooltip.getBoundingClientRect();

    let left = '50%';
    let top = '50%';
    let transform = 'translate(-50%, -50%)';

    if (step.highlightElement) {
      const element = document.querySelector(step.highlightElement);
      if (element) {
        const elRect = element.getBoundingClientRect();

        switch (step.position) {
          case 'top':
            left = `${elRect.left + elRect.width / 2}px`;
            top = `${elRect.top - 10}px`;
            transform = 'translate(-50%, -100%)';
            break;
          case 'bottom':
            left = `${elRect.left + elRect.width / 2}px`;
            top = `${elRect.bottom + 10}px`;
            transform = 'translate(-50%, 0)';
            break;
          case 'left':
            left = `${elRect.left - 10}px`;
            top = `${elRect.top + elRect.height / 2}px`;
            transform = 'translate(-100%, -50%)';
            break;
          case 'right':
            left = `${elRect.right + 10}px`;
            top = `${elRect.top + elRect.height / 2}px`;
            transform = 'translate(0, -50%)';
            break;
        }
      }
    }

    tooltip.style.left = left;
    tooltip.style.top = top;
    tooltip.style.transform = transform;
  }

  /**
   * Move to next step
   */
  nextStep(): void {
    if (!this.currentStep) return;

    if (this.currentStep.id === 'complete') {
      this.endTutorial();
      return;
    }

    if (this.currentStep.nextStep) {
      this.completedSteps.add(this.currentStep.id);
      this.saveProgress();
      this.showStep(this.currentStep.nextStep);
    }
  }

  /**
   * Move to previous step
   */
  previousStep(): void {
    if (!this.currentStep) return;

    const currentIndex = this.steps.findIndex(s => s.id === this.currentStep!.id);
    if (currentIndex > 0) {
      this.showStep(this.steps[currentIndex - 1].id);
    }
  }

  /**
   * Save tutorial progress
   */
  private saveProgress(): void {
    try {
      localStorage.setItem('bonding-tutorial-completed', JSON.stringify(Array.from(this.completedSteps)));
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Load tutorial progress
   */
  private loadProgress(): void {
    try {
      const completed = localStorage.getItem('bonding-tutorial-completed');
      if (completed) {
        this.completedSteps = new Set(JSON.parse(completed));
      }
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Check if tutorial should be shown (first visit)
   */
  shouldShowTutorial(): boolean {
    return this.completedSteps.size === 0;
  }

  /**
   * Get tutorial status
   */
  getStatus(): { isActive: boolean; currentStep: string | null; completedSteps: number } {
    return {
      isActive: this.isActive,
      currentStep: this.currentStep?.id || null,
      completedSteps: this.completedSteps.size
    };
  }
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.TutorialSystem = TutorialSystem;
}