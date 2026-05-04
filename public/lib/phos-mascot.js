/**
 * PHOS Mascot Module
 * The badass tetrahedron companion
 */

class PhosMascot {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn('[PHOS] Container not found:', containerId);
      return;
    }
    
    this.config = {
      size: options.size || 120,
      interactive: options.interactive !== false,
      voice: options.voice !== false,
      personality: options.personality || 'friendly', // friendly, sassy, wise, silly
      ...options
    };
    
    this.mood = 'neutral';
    this.energy = 1.0;
    this.blinkInterval = null;
    this.wiggleInterval = null;
    this.speechTimeout = null;
    
    this.init();
  }
  
  init() {
    this.render();
    this.attachEvents();
    this.startAnimations();
    this.speak("Hey there! I'm PHOS. Click me!", 3000);
  }
  
  render() {
    const size = this.config.size;
    const half = size / 2;
    const height = size * 0.866; // sqrt(3)/2
    
    this.container.innerHTML = `
      <div class="phos-container" style="
        width: ${size}px;
        height: ${size}px;
        position: relative;
        cursor: ${this.config.interactive ? 'pointer' : 'default'};
        filter: drop-shadow(0 0 20px rgba(77, 184, 168, 0.4));
      ">
        <svg viewBox="0 0 200 200" style="width: 100%; height: 100%; overflow: visible;">
          <defs>
            <!-- Body gradient -->
            <linearGradient id="phos-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#4db8a8;stop-opacity:0.95" />
              <stop offset="50%" style="stop-color:#3ba372;stop-opacity:0.85" />
              <stop offset="100%" style="stop-color:#2d8a6e;stop-opacity:0.75" />
            </linearGradient>
            
            <!-- Face gradient -->
            <radialGradient id="phos-face-grad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" style="stop-color:#e8e6e0;stop-opacity:0.98" />
              <stop offset="100%" style="stop-color:#c8c6c0;stop-opacity:0.9" />
            </radialGradient>
            
            <!-- Glow filter -->
            <filter id="phos-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <!-- Pulse animation -->
            <radialGradient id="phos-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#4db8a8;stop-opacity:0.6">
                <animate attributeName="stop-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" style="stop-color:#4db8a8;stop-opacity:0" />
            </radialGradient>
          </defs>
          
          <!-- Pulse ring -->
          <circle cx="100" cy="100" r="70" fill="url(#phos-pulse)" opacity="0.5" />
          
          <!-- Tetrahedron body -->
          <g id="phos-body" filter="url(#phos-glow)">
            <!-- Base triangle (back faces) -->
            <path d="M100,20 L20,140 L180,140 Z" fill="url(#phos-body-grad)" stroke="#4db8a8" stroke-width="2" opacity="0.9" />
            
            <!-- Side faces with depth -->
            <path d="M100,20 L20,140 L100,100 Z" fill="rgba(77,184,168,0.7)" stroke="#4db8a8" stroke-width="1" />
            <path d="M100,20 L180,140 L100,100 Z" fill="rgba(77,184,168,0.6)" stroke="#4db8a8" stroke-width="1" />
            <path d="M20,140 L180,140 L100,100 Z" fill="rgba(61,163,114,0.8)" stroke="#4db8a8" stroke-width="1" />
            
            <!-- Edges highlight -->
            <path d="M100,20 L20,140" stroke="#5ec8b8" stroke-width="2" fill="none" />
            <path d="M100,20 L180,140" stroke="#5ec8b8" stroke-width="2" fill="none" />
            <path d="M20,140 L180,140" stroke="#5ec8b8" stroke-width="2" fill="none" />
          </g>
          
          <!-- Face area -->
          <g id="phos-face">
            <!-- Face base -->
            <ellipse cx="100" cy="125" rx="35" ry="22" fill="url(#phos-face-grad)" />
            
            <!-- Eyes -->
            <g id="phos-eyes">
              <ellipse class="phos-eye" cx="85" cy="120" rx="6" ry="8" fill="#1a1a1a" />
              <ellipse class="phos-eye" cx="115" cy="120" rx="6" ry="8" fill="#1a1a1a" />
              
              <!-- Eye shine -->
              <circle cx="87" cy="118" r="2" fill="white" opacity="0.8" />
              <circle cx="117" cy="118" r="2" fill="white" opacity="0.8" />
            </g>
            
            <!-- Eyebrows -->
            <path id="phos-brows" d="M78,110 Q85,108 92,110 M108,110 Q115,108 122,110" 
                  stroke="#1a1a1a" stroke-width="1.5" fill="none" stroke-linecap="round" />
            
            <!-- Mouth -->
            <path id="phos-mouth" d="M90,135 Q100,142 110,135" 
                  stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round" />
            
            <!-- Blush (when happy) -->
            <ellipse id="phos-blush-left" cx="75" cy="130" rx="5" ry="3" fill="#cc6247" opacity="0" />
            <ellipse id="phos-blush-right" cx="125" cy="130" rx="5" ry="3" fill="#cc6247" opacity="0" />
          </g>
          
          <!-- Accessories -->
          <g id="phos-accessories" opacity="0">
            <!-- Sunglasses (sassy mode) -->
            <path d="M70,115 L95,115 L95,125 L85,125 L80,120 L75,125 L70,125 Z" fill="#1a1a1a" />
            <path d="M105,115 L130,115 L130,125 L125,125 L120,120 L115,125 L105,125 Z" fill="#1a1a1a" />
            <line x1="95" y1="118" x2="105" y2="118" stroke="#1a1a1a" stroke-width="2" />
          </g>
          
          <!-- Speech bubble (hidden by default) -->
          <g id="phos-speech" opacity="0" transform="translate(130, 60)">
            <rect x="0" y="0" width="140" height="50" rx="10" fill="rgba(20,23,31,0.95)" 
                  stroke="#4db8a8" stroke-width="1.5" />
            <polygon points="-10,25 0,20 0,30" fill="rgba(20,23,31,0.95)" />
            <polygon points="-10,25 0,20 0,30" fill="none" stroke="#4db8a8" stroke-width="1.5" 
                     stroke-linejoin="round" />
            <text id="phos-speech-text" x="70" y="30" text-anchor="middle" 
                  fill="#d8d6d0" font-family="JetBrains Mono, monospace" font-size="11">
              Hello!
            </text>
          </g>
        </svg>
      </div>
    `;
    
    // Add CSS animations
    if (!document.getElementById('phos-mascot-styles')) {
      const style = document.createElement('style');
      style.id = 'phos-mascot-styles';
      style.textContent = `
        .phos-container {
          animation: phos-float 3s ease-in-out infinite;
          transform-origin: center;
        }
        
        @keyframes phos-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        
        .phos-container:hover {
          animation: phos-wiggle 0.5s ease-in-out;
        }
        
        @keyframes phos-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        
        .phos-container:active {
          transform: scale(0.95);
        }
        
        .phos-eye {
          transform-origin: center;
          transition: ry 0.1s;
        }
        
        .phos-eye.blink {
          ry: 0.5;
        }
        
        #phos-mouth {
          transition: d 0.3s ease;
        }
        
        #phos-speech {
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        #phos-speech.visible {
          opacity: 1 !important;
          transform: translate(130px, 40px) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  attachEvents() {
    if (!this.config.interactive) return;
    
    this.container.addEventListener('click', () => this.interact());
    
    // Track mouse for eye following
    document.addEventListener('mousemove', (e) => {
      if (!this.container) return;
      const rect = this.container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const distance = Math.min(3, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 50);
      
      const eyes = this.container.querySelectorAll('.phos-eye');
      eyes.forEach(eye => {
        const cx = parseFloat(eye.getAttribute('cx')) || 85;
        const cy = parseFloat(eye.getAttribute('cy')) || 120;
        eye.setAttribute('transform', `translate(${Math.cos(angle) * distance}, ${Math.sin(angle) * distance})`);
      });
    });
  }
  
  startAnimations() {
    // Blink randomly
    this.blinkInterval = setInterval(() => {
      if (Math.random() > 0.7) this.blink();
    }, 3000);
  }
  
  blink() {
    const eyes = this.container.querySelectorAll('.phos-eye');
    eyes.forEach(eye => eye.classList.add('blink'));
    setTimeout(() => {
      eyes.forEach(eye => eye.classList.remove('blink'));
    }, 150);
  }
  
  interact() {
    const phrases = {
      friendly: [
        "Hey there! Need help?",
        "Let's build something cool!",
        "I'm PHOS, your guide!",
        "Click around, explore!",
        "The mesh is alive!",
        "Family first, always!"
      ],
      sassy: [
        "Ugh, what now?",
        "I'm a tetrahedron, not a miracle worker!",
        "Did you try turning it off and on?",
        "Your code is... interesting.",
        "I'm judging your CSS choices.",
        "Whatever, I'm still fabulous."
      ],
      wise: [
        "The K4 mesh holds all answers.",
        "Trust the geodesic structure.",
        "Isostatic rigidity brings stability.",
        "Build, create, connect.",
        "Four vertices, infinite possibilities.",
        "The operator is the key."
      ],
      silly: [
        "Wheeeee! I'm a spinning triangle!",
        "I put the 'fun' in 'function!'",
        "Triangle? TRIANGLE! 🎉",
        "I'm basically a fancy pyramid!",
        "Don't tell the other shapes I'm cooler!",
        "Spin me right round, baby!"
      ]
    };
    
    const personalityPhrases = phrases[this.config.personality] || phrases.friendly;
    const phrase = personalityPhrases[Math.floor(Math.random() * personalityPhrases.length)];
    
    this.speak(phrase);
    this.changeMood(['happy', 'excited', 'sassy', 'wise'][Math.floor(Math.random() * 4)]);
    this.blink();
  }
  
  speak(text, duration = 4000) {
    const speech = this.container.querySelector('#phos-speech');
    const speechText = this.container.querySelector('#phos-speech-text');
    
    speechText.textContent = text;
    speech.classList.add('visible');
    
    clearTimeout(this.speechTimeout);
    this.speechTimeout = setTimeout(() => {
      speech.classList.remove('visible');
    }, duration);
  }
  
  changeMood(mood) {
    this.mood = mood;
    const mouth = this.container.querySelector('#phos-mouth');
    const brows = this.container.querySelector('#phos-brows');
    const blushLeft = this.container.querySelector('#phos-blush-left');
    const blushRight = this.container.querySelector('#phos-blush-right');
    const accessories = this.container.querySelector('#phos-accessories');
    
    switch(mood) {
      case 'happy':
        mouth.setAttribute('d', 'M90,135 Q100,145 110,135');
        brows.setAttribute('d', 'M78,108 Q85,105 92,108 M108,108 Q115,105 122,108');
        blushLeft.setAttribute('opacity', '0.3');
        blushRight.setAttribute('opacity', '0.3');
        accessories.setAttribute('opacity', '0');
        break;
        
      case 'sassy':
        mouth.setAttribute('d', 'M92,138 Q100,135 108,138');
        brows.setAttribute('d', 'M78,112 Q85,115 92,112 M108,108 Q115,105 122,108');
        blushLeft.setAttribute('opacity', '0');
        blushRight.setAttribute('opacity', '0');
        accessories.setAttribute('opacity', '1');
        break;
        
      case 'wise':
        mouth.setAttribute('d', 'M90,137 Q100,140 110,137');
        brows.setAttribute('d', 'M78,108 Q85,112 92,108 M108,108 Q115,112 122,108');
        blushLeft.setAttribute('opacity', '0');
        blushRight.setAttribute('opacity', '0');
        accessories.setAttribute('opacity', '0');
        break;
        
      case 'excited':
        mouth.setAttribute('d', 'M88,135 Q100,148 112,135');
        brows.setAttribute('d', 'M78,105 Q85,102 92,105 M108,105 Q115,102 122,105');
        blushLeft.setAttribute('opacity', '0.4');
        blushRight.setAttribute('opacity', '0.4');
        accessories.setAttribute('opacity', '0');
        break;
        
      default:
        mouth.setAttribute('d', 'M90,135 Q100,142 110,135');
        brows.setAttribute('d', 'M78,110 Q85,108 92,110 M108,110 Q115,108 122,110');
        blushLeft.setAttribute('opacity', '0');
        blushRight.setAttribute('opacity', '0');
        accessories.setAttribute('opacity', '0');
    }
  }
  
  destroy() {
    clearInterval(this.blinkInterval);
    clearTimeout(this.speechTimeout);
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Auto-initialize if container exists
if (document.getElementById('phos-mascot')) {
  window.phosMascot = new PhosMascot('phos-mascot', {
    size: 140,
    personality: 'sassy'
  });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhosMascot;
}
