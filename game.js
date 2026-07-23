document.addEventListener('DOMContentLoaded', () => {
  // Global error handler to print JS crashes directly to the HUD terminal log
  window.onerror = function (message, source, lineno, colno, error) {
    const logEl = document.getElementById('terminalLog');
    if (logEl) {
      logEl.textContent = `CRITICAL_ERR: ${message} (Line: ${lineno})`;
      logEl.style.color = '#ff0055'; // neon red/pink
      logEl.style.textShadow = '0 0 5px #ff0055';
    }
    return false;
  };

  // Apply theme override instantly on load
  const currentTheme = localStorage.getItem('neon_settings_theme') || 'default';
  if (currentTheme !== 'default') {
    document.body.classList.add(`theme-${currentTheme}`);
  }

  // Elements
  const levelVal = document.getElementById('levelVal');
  const scoreVal = document.getElementById('scoreVal');
  const bestVal = document.getElementById('bestVal');
  
  const boardContainer = document.getElementById('boardContainer');
  const gameBoard = document.getElementById('gameBoard');
  const gameWrapper = document.getElementById('gameWrapper');
  const centerStartBtn = document.getElementById('centerStartBtn');
  const startBtnText = document.getElementById('startBtnText');
  const playIcon = document.getElementById('playIcon');
  const terminalLog = document.getElementById('terminalLog');

  // Mode and Difficulty elements
  const modeNormalBtn = document.getElementById('modeNormalBtn');
  const modeAdvancedBtn = document.getElementById('modeAdvancedBtn');
  const rulesModeSelect = document.getElementById('rulesModeSelect');
  const difficultySelect = document.getElementById('difficultySelect');
  const gameTimerBarContainer = document.getElementById('gameTimerBarContainer');
  const gameTimerBar = document.getElementById('gameTimerBar');
  const livesHudBox = document.getElementById('livesHudBox');
  const livesVal = document.getElementById('livesVal');

  // Pads mapping
  const pads = {
    green: document.getElementById('pad-green'),
    cyan: document.getElementById('pad-cyan'),
    blue: document.getElementById('pad-blue'),
    orange: document.getElementById('pad-orange'),
    red: document.getElementById('pad-red'),
    yellow: document.getElementById('pad-yellow'),
    pink: document.getElementById('pad-pink'),
    purple: document.getElementById('pad-purple')
  };

  const restartBtn = document.getElementById('restartBtn');
  const muteBtn = document.getElementById('muteBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseIcon = document.getElementById('pauseIcon');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const resumeBtn = document.getElementById('resumeBtn');

  // Configurations
  let gameMode = 'normal'; // normal (4p), advanced (8p)
  let rulesMode = 'classic'; // classic, timer, survival, daily
  let difficulty = 'medium'; // easy, medium, hard
  let activePool = ['green', 'blue', 'yellow', 'purple'];

  // Game state variables
  let sequence = [];
  let userSequence = [];
  let level = 1;
  let score = 0;
  let lives = 3;
  let gameState = 'idle'; // idle, watch, user, paused, over
  let previousState = 'idle';

  // Timer mode tick variables
  let turnTimerInterval = null;
  let timeLeft = 100; // percent
  
  // Seeded Random Generator for Daily Challenge
  let dailySeed = 12345;
  function seedRandom() {
    // Generate seed based on YYYYMMDD date stamp
    const d = new Date();
    const dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    dailySeed = parseInt(dateStr);
  }
  function seededRandom() {
    let x = Math.sin(dailySeed++) * 10000;
    return x - Math.floor(x);
  }

  // Audio Context (Web Audio API)
  let audioCtx = null;
  let bgmNode1 = null; // Bass drone oscillator 1
  let bgmNode2 = null; // Bass drone oscillator 2
  let bgmGain = null;  // Master BGM volume controller
  
  // Sync Audio Toggles from localStorage settings
  let sfxEnabled = localStorage.getItem('neon_settings_sfx') !== 'off'; // default ON
  let bgmEnabled = localStorage.getItem('neon_settings_bgm') === 'on'; // default OFF

  // 8 frequency keys mapped diatonically/chromatically
  const frequencies = {
    green: 261.63,   // C4
    cyan: 293.66,    // D4
    blue: 329.63,    // E4
    orange: 349.23,  // F4
    yellow: 392.00,  // G4
    red: 440.00,     // A4
    pink: 493.88,    // B4
    purple: 466.16   // A#4
  };

  // Set initial high score best text based on selected rules mode / arena size
  function getBestScoreKey() {
    return `neon_best_score_${rulesMode}_${gameMode}`;
  }
  function updateBestScoreUI() {
    const key = getBestScoreKey();
    const high = localStorage.getItem(key) || 0;
    bestVal.textContent = String(high).padStart(3, '0');
  }
  updateBestScoreUI();

  // Set pointer events on pads to prevent clicking during watch/idle state
  function setPadsPointerEvents(state) {
    Object.keys(pads).forEach(color => {
      if (pads[color]) {
        pads[color].style.pointerEvents = state;
      }
    });
  }

  // Initialize Web Audio Context lazily
  function initAudio() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
  }

  // Synthesize SFX pad chimes
  function playTone(freq, type = 'sine', duration = 0.3, volume = 0.25) {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e){}
  }

  function playSuccessChime() {
    if (!sfxEnabled) return;
    setTimeout(() => playTone(392.00, 'triangle', 0.15, 0.15), 0);   // G4
    setTimeout(() => playTone(523.25, 'triangle', 0.15, 0.15), 100); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.25, 0.15), 200); // E5
  }

  function playErrorBuzzer() {
    if (!sfxEnabled) return;
    playTone(110.00, 'sawtooth', 0.45, 0.2);
    setTimeout(() => playTone(98.00, 'sawtooth', 0.35, 0.2), 100);
  }

  function playLifeLostChime() {
    if (!sfxEnabled) return;
    playTone(220.00, 'sawtooth', 0.25, 0.15);
    setTimeout(() => playTone(180.00, 'sawtooth', 0.25, 0.15), 80);
  }

  // BGM Looping Neural Drone synthesis
  function startBgm() {
    if (!bgmEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (bgmNode1) return; // already playing
      
      bgmGain = audioCtx.createGain();
      bgmGain.gain.setValueAtTime(0.015, audioCtx.currentTime); // low ambient volume
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, audioCtx.currentTime);
      
      bgmNode1 = audioCtx.createOscillator();
      bgmNode1.type = 'triangle';
      bgmNode1.frequency.setValueAtTime(110.00, audioCtx.currentTime); // A2 drone
      
      bgmNode2 = audioCtx.createOscillator();
      bgmNode2.type = 'sawtooth';
      bgmNode2.frequency.setValueAtTime(164.81, audioCtx.currentTime); // E3 drone
      
      bgmNode1.connect(filter);
      bgmNode2.connect(filter);
      filter.connect(bgmGain);
      bgmGain.connect(audioCtx.destination);
      
      bgmNode1.start();
      bgmNode2.start();
    } catch(e){}
  }

  function stopBgm() {
    try {
      if (bgmNode1) {
        bgmNode1.stop();
        bgmNode2.stop();
        bgmNode1 = null;
        bgmNode2 = null;
      }
    } catch(e){}
  }

  function setBgmVolume(volume) {
    if (bgmGain) {
      bgmGain.gain.setValueAtTime(volume, audioCtx.currentTime);
    }
  }

  // Active pad highlights
  function activatePad(color) {
    pads[color].classList.add('active');
    
    // Highlight duration based on difficulty settings
    let highlightDuration = 300;
    if (difficulty === 'easy') highlightDuration = 450;
    if (difficulty === 'hard') highlightDuration = 200;

    playTone(frequencies[color], 'sine', highlightDuration / 1000 + 0.05, 0.25);
    
    setTimeout(() => {
      pads[color].classList.remove('active');
    }, highlightDuration);
  }

  // Print logs to terminal HUD
  function logTerminal(message, type = 'info') {
    terminalLog.textContent = `${type.toUpperCase()}: ${message}`;
    terminalLog.style.animation = 'none';
    terminalLog.offsetHeight; // trigger reflow
    terminalLog.style.animation = 'blink-fast 0.2s steps(2) 2';
  }

  // Render Hearts for Survival mode
  function renderLives() {
    livesVal.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.className = `heart-icon ${i >= lives ? 'lost' : ''}`;
      // SVG Heart path
      heart.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
      livesVal.appendChild(heart);
    }
  }

  // Generate sequence step
  function nextSequenceStep() {
    let randomColor;
    if (rulesMode === 'daily') {
      // Seeded random generation
      const randIdx = Math.floor(seededRandom() * activePool.length);
      randomColor = activePool[randIdx];
    } else {
      randomColor = activePool[Math.floor(Math.random() * activePool.length)];
    }
    sequence.push(randomColor);
  }

  // Playback sequence sequence
  function playSequence() {
    gameState = 'watch';
    logTerminal('WATCH CORE EMISSION SEQUENCE...', 'sys');
    setPadsPointerEvents('none');
    
    // Hide timer bar during playback
    gameTimerBarContainer.classList.remove('visible');

    let i = 0;
    // Speed interval based on difficulty speed selectors
    let playbackInterval = 600;
    if (difficulty === 'easy') playbackInterval = 850;
    if (difficulty === 'hard') playbackInterval = 400;

    const interval = setInterval(() => {
      if (gameState === 'paused') {
        clearInterval(interval);
        return;
      }
      
      activatePad(sequence[i]);
      i++;
      
      if (i >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => {
          if (gameState !== 'paused') {
            startUserInputPhase();
          }
        }, 400);
      }
    }, playbackInterval);
  }

  // Start input phase & timer countdown ticks
  function startUserInputPhase() {
    gameState = 'user';
    userSequence = [];
    setPadsPointerEvents('all');
    logTerminal('YOUR TURN! DECRYPT SEQUENCE...', 'sys');

    if (rulesMode === 'timer') {
      gameTimerBarContainer.classList.add('visible');
      timeLeft = 100;
      gameTimerBar.style.width = '100%';
      gameTimerBar.style.backgroundColor = '';

      // Ticking timer configurations: 10s base minus 0.4s per level
      const totalDurationSec = Math.max(2, 10 - (level * 0.4));
      const tickIntervalMs = 100;
      const stepCost = (tickIntervalMs / (totalDurationSec * 1000)) * 100;

      clearInterval(turnTimerInterval);
      turnTimerInterval = setInterval(() => {
        if (gameState === 'paused') return;

        timeLeft -= stepCost;
        if (timeLeft <= 0) {
          timeLeft = 0;
          gameTimerBar.style.width = '0%';
          clearInterval(turnTimerInterval);
          
          // Time expired game over
          logTerminal('TIME LIMIT EXPIRED INTRUSION DETECTED!', 'err');
          triggerGameError();
        } else {
          gameTimerBar.style.width = timeLeft + '%';
          
          // Warning indicator colors when time is low
          if (timeLeft <= 30) {
            gameTimerBar.style.backgroundColor = 'var(--neon-red)';
          }
        }
      }, tickIntervalMs);
    }
  }

  // Click handler
  function handlePadClick(color) {
    if (gameState !== 'user') return;
    
    activatePad(color);
    userSequence.push(color);
    
    const currentIndex = userSequence.length - 1;
    
    if (userSequence[currentIndex] !== sequence[currentIndex]) {
      // Mismatch handling
      if (rulesMode === 'survival') {
        lives--;
        renderLives();
        playLifeLostChime();
        logTerminal(`DECRYPT_KEY_FAIL! ${lives} SHIELD CHANNELS REMAINING.`, 'err');
        
        userSequence = []; // Reset input sequence
        
        // Page flash red indicator
        gameWrapper.classList.add('screen-red-flash');
        setTimeout(() => gameWrapper.classList.remove('screen-red-flash'), 250);

        if (lives <= 0) {
          triggerGameError();
        }
      } else {
        triggerGameError();
      }
      return;
    }
    
    // Complete input step match
    if (userSequence.length === sequence.length) {
      clearInterval(turnTimerInterval);
      triggerLevelComplete();
    }
  }

  // Complete level updates
  function triggerLevelComplete() {
    gameState = 'watch';
    setPadsPointerEvents('none');
    
    playSuccessChime();
    logTerminal('LINK UPLINK STABLE. SECURING NEXUS...', 'sys');

    gameWrapper.classList.add('screen-green-flash');
    setTimeout(() => {
      gameWrapper.classList.remove('screen-green-flash');
    }, 450);

    // Points multipliers
    let diffMultiplier = 1.0;
    if (difficulty === 'easy') diffMultiplier = 0.75;
    if (difficulty === 'hard') diffMultiplier = 1.5;

    let rulesMultiplier = 1.0;
    if (rulesMode === 'timer') rulesMultiplier = 1.25;
    if (rulesMode === 'survival') rulesMultiplier = 1.25;
    if (rulesMode === 'daily') rulesMultiplier = 1.5;

    const basePoints = (gameMode === 'advanced' ? 20 : 10);
    const addedScore = Math.round(basePoints * diffMultiplier);
    score += addedScore;
    
    // Calculate and award XP to profile
    const addedXp = Math.round(basePoints * diffMultiplier * rulesMultiplier);
    const prevTotalXp = parseInt(localStorage.getItem('neon_total_xp')) || 0;
    const newTotalXp = prevTotalXp + addedXp;
    localStorage.setItem('neon_total_xp', newTotalXp);
    
    // Increment games played counter
    const prevGames = parseInt(localStorage.getItem('neon_games_played')) || 0;
    localStorage.setItem('neon_games_played', prevGames + 1);

    level++;
    
    levelVal.textContent = String(level).padStart(2, '0');
    scoreVal.textContent = String(score).padStart(3, '0');

    nextSequenceStep();
    setTimeout(() => {
      if (gameState !== 'paused') {
        playSequence();
      }
    }, 1200);
  }

  // Game over sequences
  function triggerGameError() {
    gameState = 'over';
    setPadsPointerEvents('none');
    clearInterval(turnTimerInterval);
    
    playErrorBuzzer();
    logTerminal('INTERFACE DE-SYNCHRONIZED. DISCONNECTED.', 'err');

    gameWrapper.classList.add('shake-container');
    gameWrapper.classList.add('screen-red-flash');
    
    setTimeout(() => {
      gameWrapper.classList.remove('shake-container');
      gameWrapper.classList.remove('screen-red-flash');
    }, 500);

    // Save and compare high score
    const key = getBestScoreKey();
    const currentHigh = parseInt(localStorage.getItem(key)) || 0;
    if (score > currentHigh) {
      localStorage.setItem(key, score);
      bestVal.textContent = String(score).padStart(3, '0');
      logTerminal('NEW PERSONAL HIGH STREAK RECORDED IN MODULE!', 'sys');
    }

    // Submit score to backend API
    const streakVal = Math.max(0, level - 1);
    const accuracyVal = level > 1 ? Math.max(50.0, Math.min(100.0, Math.round((streakVal / level) * 1000) / 10)) : 100.0;
    
    fetch('backend/api/scores/submit.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        score: score,
        level: level,
        accuracy: accuracyVal,
        streak: streakVal,
        game_mode: gameMode,
        rules_mode: rulesMode,
        difficulty: difficulty
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        logTerminal('NEURAL SCORES SYNCED TO THE REGISTRY.', 'sys');
      } else {
        logTerminal('SYNC_FAILED: GUEST_PILOT_OR_UNAUTHORIZED', 'warn');
      }
    })
    .catch(err => {
      logTerminal('SYNC_FAILED: REGISTRY_LINK_OFFLINE', 'warn');
    });

    // Reset center button states
    centerStartBtn.classList.remove('playing');
    startBtnText.textContent = 'RETRY';
    playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
  }

  function resetGame() {
    clearInterval(turnTimerInterval);
    sequence = [];
    userSequence = [];
    level = 1;
    score = 0;
    lives = 3;
    
    levelVal.textContent = '01';
    scoreVal.textContent = '000';
    
    centerStartBtn.classList.remove('playing');
    startBtnText.textContent = 'START';
    playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
    
    gameState = 'idle';
    setPadsPointerEvents('none');
    gameTimerBarContainer.classList.remove('visible');
    
    if (rulesMode === 'survival') {
      livesHudBox.style.display = 'block';
      renderLives();
    } else {
      livesHudBox.style.display = 'none';
    }
    
    updateBestScoreUI();
  }

  // Pad click events
  Object.keys(pads).forEach(color => {
    pads[color].addEventListener('mousedown', () => {
      if (gameState === 'user') {
        handlePadClick(color);
      }
    });
  });

  // Arena Mode Selection
  function setGameMode(mode) {
    if (gameMode === mode) return;
    try {
      initAudio();
      if (audioCtx) {
        playTone(440, 'triangle', 0.15, 0.1); 
      }
    } catch (e) {}
    
    gameMode = mode;
    resetGame();
    
    if (gameMode === 'advanced') {
      modeNormalBtn.classList.remove('active');
      modeAdvancedBtn.classList.add('active');
      gameBoard.classList.add('advanced');
      activePool = ['green', 'cyan', 'blue', 'orange', 'red', 'yellow', 'pink', 'purple'];
      logTerminal('ADVANCED ARENA MAP LOADED (8 PADS)', 'sys');
    } else {
      modeAdvancedBtn.classList.remove('active');
      modeNormalBtn.classList.add('active');
      gameBoard.classList.remove('advanced');
      activePool = ['green', 'blue', 'yellow', 'purple'];
      logTerminal('NORMAL ARENA DEPLOYED (4 PADS)', 'sys');
    }
  }

  modeNormalBtn.addEventListener('click', () => setGameMode('normal'));
  modeAdvancedBtn.addEventListener('click', () => setGameMode('advanced'));

  // Rules mode select event listener
  rulesModeSelect.addEventListener('change', () => {
    rulesMode = rulesModeSelect.value;
    
    if (rulesMode === 'daily') {
      seedRandom();
    }
    
    resetGame();
    logTerminal(`RULES MODE CONFIGURED: ${rulesMode.toUpperCase()}`, 'sys');
  });

  // Difficulty select event listener
  difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
    resetGame();
    logTerminal(`SPEED MODE CALIBRATED: ${difficulty.toUpperCase()}`, 'sys');
  });

  // Start Trigger click
  centerStartBtn.addEventListener('click', () => {
    try {
      initAudio();
      startBgm();
    } catch (e) {
      console.warn("Audio start failed:", e);
    }
    
    if (gameState !== 'idle' && gameState !== 'over') return;
    
    level = 1;
    score = 0;
    lives = 3;
    sequence = [];
    userSequence = [];
    
    levelVal.textContent = '01';
    scoreVal.textContent = '000';
    
    if (rulesMode === 'survival') {
      renderLives();
    }
    
    centerStartBtn.classList.add('playing');
    startBtnText.textContent = 'PLAYING';
    
    playIcon.innerHTML = `<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>`;
    
    nextSequenceStep();
    logTerminal('ESTABLISHING INTERFACE SYNC...', 'sys');
    
    setTimeout(() => {
      playSequence();
    }, 1000);
  });

  restartBtn.addEventListener('click', () => {
    initAudio();
    logTerminal('REBOOTING SIMULATOR MODULE...', 'sys');
    resetGame();
  });

  // Master audio loop mute button
  muteBtn.addEventListener('click', () => {
    sfxEnabled = !sfxEnabled;
    bgmEnabled = sfxEnabled;
    
    localStorage.setItem('neon_settings_sfx', sfxEnabled ? 'on' : 'off');
    localStorage.setItem('neon_settings_bgm', bgmEnabled ? 'on' : 'off');

    if (!sfxEnabled) {
      stopBgm();
      muteBtn.innerHTML = `
        <svg id="muteIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v6a3 3 0 0 0 3 3h1.586l4.707 4.707A1 1 0 0 0 20 22V4a1 1 0 0 0-1.707-.707L13.586 8H12a3 3 0 0 0-3 3z"/></svg>
        AUDIO_MUTED
      `;
      muteBtn.style.color = 'var(--neon-red)';
      muteBtn.style.borderColor = 'var(--neon-red)';
    } else {
      startBgm();
      muteBtn.innerHTML = `
        <svg id="muteIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        AUDIO_ON
      `;
      muteBtn.style.color = '';
      muteBtn.style.borderColor = '';
    }
  });

  // Pause togglers
  function togglePause() {
    if (gameState === 'idle' || gameState === 'over') return;
    
    if (gameState !== 'paused') {
      previousState = gameState;
      gameState = 'paused';
      pauseOverlay.classList.remove('hidden');
      setBgmVolume(0.003); // lower BGM drone volume
      
      pauseBtn.innerHTML = `
        <svg id="pauseIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        RESUME_GAME
      `;
      pauseBtn.style.color = 'var(--neon-yellow)';
      pauseBtn.style.borderColor = 'var(--neon-yellow)';
      logTerminal('PROTOCOL PAUSED. STANDBY...', 'sys');
    } else {
      gameState = previousState;
      pauseOverlay.classList.add('hidden');
      setBgmVolume(0.015);
      
      pauseBtn.innerHTML = `
        <svg id="pauseIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="4" x2="18" y2="20"/><line x1="6" y1="4" x2="6" y2="20"/></svg>
        PAUSE_GAME
      `;
      pauseBtn.style.color = '';
      pauseBtn.style.borderColor = '';
      
      if (gameState === 'watch') {
        playSequence();
      } else {
        logTerminal('YOUR TURN! REPLICATE PATTERN...', 'sys');
      }
    }
  }

  pauseBtn.addEventListener('click', togglePause);
  resumeBtn.addEventListener('click', togglePause);

  // Keyboard accessibility shortcut listeners
  window.addEventListener('keydown', (e) => {
    // Ignore when user typing inside inputs or forms
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    
    // Start game shortcut
    if ((key === ' ' || key === 'enter') && (gameState === 'idle' || gameState === 'over')) {
      e.preventDefault();
      centerStartBtn.click();
      return;
    }

    // Pause game shortcut
    if (key === 'escape' || key === 'p') {
      e.preventDefault();
      togglePause();
      return;
    }

    // Pad clicks shortcuts
    if (gameState === 'user') {
      if (gameMode === 'normal') {
        if (key === 'q') handlePadClick('green');
        if (key === 'w') handlePadClick('blue');
        if (key === 'a') handlePadClick('yellow');
        if (key === 's') handlePadClick('purple');
      } else {
        if (key === 'q') handlePadClick('green');
        if (key === 'w') handlePadClick('cyan');
        if (key === 'e') handlePadClick('blue');
        if (key === 'a') handlePadClick('orange');
        if (key === 'd') handlePadClick('red');
        if (key === 'z') handlePadClick('yellow');
        if (key === 'x') handlePadClick('pink');
        if (key === 'c') handlePadClick('purple');
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
