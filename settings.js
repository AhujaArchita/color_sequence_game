document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const settingsXpVal = document.getElementById('settingsXpVal');
  const bgmToggle = document.getElementById('bgmToggle');
  const sfxToggle = document.getElementById('sfxToggle');
  const resetBtn = document.getElementById('resetBtn');

  // Theme cards
  const themeCards = {
    default: document.getElementById('theme-default'),
    'amber-gold': document.getElementById('theme-amber-gold'),
    synthwave: document.getElementById('theme-synthwave'),
    toxic: document.getElementById('theme-toxic')
  };

  // Sync BGM, SFX & Theme selections from LocalStorage
  const totalXp = parseInt(localStorage.getItem('neon_total_xp')) || 0;
  const currentTheme = localStorage.getItem('neon_settings_theme') || 'default';
  const bgmState = localStorage.getItem('neon_settings_bgm') !== 'off'; // default ON
  const sfxState = localStorage.getItem('neon_settings_sfx') !== 'off'; // default ON

  // Audio Context (Web Audio API)
  let audioCtx = null;
  
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playSound(freq, type = 'sine', duration = 0.1, volume = 0.1) {
    if (!sfxToggle.checked) return;
    initAudio();
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  // Load and apply Theme classes instantly
  function applyTheme(themeName) {
    // Remove all previous theme classes
    document.body.classList.remove('theme-amber-gold', 'theme-synthwave', 'theme-toxic');
    
    if (themeName !== 'default') {
      document.body.classList.add(`theme-${themeName}`);
    }
  }

  // Set initial UI states
  applyTheme(currentTheme);
  settingsXpVal.textContent = `LOAD: ${totalXp.toLocaleString()} XP`;
  bgmToggle.checked = bgmState;
  sfxToggle.checked = sfxState;

  // Initialize Theme Cards lock states
  Object.keys(themeCards).forEach(themeName => {
    const card = themeCards[themeName];
    if (themeName === 'default') {
      // Default is always unlocked
      card.classList.remove('locked');
    } else {
      const reqXp = parseInt(card.getAttribute('data-xp-req'));
      if (totalXp >= reqXp) {
        card.classList.remove('locked');
        card.querySelector('.theme-status').textContent = 'UNLOCKED';
        card.querySelector('.theme-status').style.color = 'var(--text-secondary)';
      }
    }

    // Set Active Card visual outline
    if (themeName === currentTheme) {
      card.classList.add('active-theme');
      card.querySelector('.theme-status').textContent = 'ACTIVE';
    } else {
      card.classList.remove('active-theme');
    }

    // Bind click listener
    card.addEventListener('click', () => {
      if (card.classList.contains('locked')) {
        // Locked theme error buzz
        playSound(150, 'sawtooth', 0.25, 0.15);
        return;
      }

      // Play success click sound
      playSound(523.25, 'triangle', 0.15, 0.1); // C5
      
      // Update local storage settings
      localStorage.setItem('neon_settings_theme', themeName);
      
      // Update UI active card states
      Object.keys(themeCards).forEach(name => {
        themeCards[name].classList.remove('active-theme');
        const req = parseInt(themeCards[name].getAttribute('data-xp-req'));
        if (name === 'default') {
          themeCards[name].querySelector('.theme-status').textContent = 'SELECT';
        } else if (totalXp >= req) {
          themeCards[name].querySelector('.theme-status').textContent = 'UNLOCKED';
        }
      });

      card.classList.add('active-theme');
      card.querySelector('.theme-status').textContent = 'ACTIVE';

      // Apply theme CSS variable override block
      applyTheme(themeName);
    });
  });

  // BGM Toggle changes
  bgmToggle.addEventListener('change', () => {
    const state = bgmToggle.checked ? 'on' : 'off';
    localStorage.setItem('neon_settings_bgm', state);
    playSound(880, 'sine', 0.08, 0.05); // high click
  });

  // SFX Toggle changes
  sfxToggle.addEventListener('change', () => {
    const state = sfxToggle.checked ? 'on' : 'off';
    localStorage.setItem('neon_settings_sfx', state);
    playSound(880, 'sine', 0.08, 0.05);
  });

  // Danger reset button
  resetBtn.addEventListener('click', () => {
    playSound(220, 'sawtooth', 0.3, 0.2);
    
    const confirm1 = confirm("NEURAL WARNING: YOU ARE INITIATING A FULL PROFILE DATA PURGE.\nALL LOCAL SCORES, XP METRICS, BIOS DATA AND ACHIEVEMENT REWARDS WILL BE DELETED.\n\nPROCEED?");
    if (confirm1) {
      const confirm2 = confirm("FINAL AUTHORIZATION INQUIRY:\nCONFIRM INTEGRITY OVERRIDE AND DESTROY ALL NEON SEQUENCE PROFILE DATA?");
      if (confirm2) {
        localStorage.clear();
        alert("PROFILE DELETED. SYSTEM CORE REBOOTING...");
        window.location.href = 'index.html';
      }
    }
  });

  // Global Neural Loader count-up animation
  const loader = document.getElementById('neuralLoader');
  const loaderPct = document.getElementById('loaderPct');
  if (loader && loaderPct) {
    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.floor(Math.random() * 20) + 10;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add('loaded');
        }, 150);
      }
      loaderPct.textContent = pct + '%';
    }, 60);
  }
});
