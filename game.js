document.addEventListener('DOMContentLoaded', () => {
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
  
  // Mode switcher elements
  const modeNormalBtn = document.getElementById('modeNormalBtn');
  const modeAdvancedBtn = document.getElementById('modeAdvancedBtn');

  // Pads mapping (All 8 colors)
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

  // Game Mode Configurations
  let gameMode = 'normal'; // normal (4p), advanced (8p)
  let activePool = ['green', 'blue', 'yellow', 'purple'];

  // Game Variables
  let sequence = [];
  let userSequence = [];
  let level = 1;
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('neon_best_score')) || 0;
  
  let gameState = 'idle'; // idle, watch, user, paused, over
  let previousState = 'idle';
  let isMuted = false;
  
  // Audio Synthesizer setup (Web Audio API)
  let audioCtx = null;
  
  // 8 frequency keys mapped chromatically / diatonically
  const frequencies = {
    green: 261.63,   // C4
    cyan: 293.66,    // D4
    blue: 329.63,    // E4
    orange: 349.23,  // F4
    red: 440.00,     // A4
    yellow: 392.00,  // G4
    pink: 493.88,    // B4
    purple: 466.16   // A#4
  };

  // Set Best Score UI
  bestVal.textContent = String(bestScore).padStart(3, '0');

  // Initialize Audio Context lazily on first user gesture
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Synthesize Pad Tone
  function playTone(freq, type = 'sine', duration = 0.3, volume = 0.25) {
    if (isMuted) return;
    initAudio();
    
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      // Prevent clicking by fading in/out
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context blocked or failed to initialize", e);
    }
  }

  // Synthesize Success chime
  function playSuccessChime() {
    if (isMuted) return;
    setTimeout(() => playTone(392.00, 'triangle', 0.15, 0.2), 0);   // G4
    setTimeout(() => playTone(523.25, 'triangle', 0.15, 0.2), 100); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.25, 0.2), 200); // E5
  }

  // Synthesize Error buzzer
  function playErrorBuzzer() {
    if (isMuted) return;
    playTone(110.00, 'sawtooth', 0.45, 0.3);
    setTimeout(() => playTone(98.00, 'sawtooth', 0.35, 0.3), 100);
  }

  // Flash individual pad
  function activatePad(color) {
    pads[color].classList.add('active');
    playTone(frequencies[color], 'sine', 0.35, 0.25);
    
    setTimeout(() => {
      pads[color].classList.remove('active');
    }, 300);
  }

  // Log to terminal HUD
  function logTerminal(message, type = 'info') {
    terminalLog.textContent = `${type.toUpperCase()}: ${message}`;
    
    // Quick terminal scan effect
    terminalLog.style.animation = 'none';
    terminalLog.offsetHeight; // trigger reflow
    terminalLog.style.animation = 'blink-fast 0.2s steps(2) 2';
  }

  // Game flow: Next Sequence Step generator based on active pool
  function nextSequenceStep() {
    const randomColor = activePool[Math.floor(Math.random() * activePool.length)];
    sequence.push(randomColor);
  }

  // Playback the sequence generated
  function playSequence() {
    gameState = 'watch';
    logTerminal('WATCH SEQUENCE...', 'sys');
    
    // Disable clicks during playback
    boardContainer.style.pointerEvents = 'none';
    
    let i = 0;
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
        }, 500);
      }
    }, 600);
  }

  // Enter User Input state
  function startUserInputPhase() {
    gameState = 'user';
    userSequence = [];
    boardContainer.style.pointerEvents = 'all';
    logTerminal('YOUR TURN! REPLICATE PATTERN...', 'sys');
  }

  // Handle pad clicks
  function handlePadClick(color) {
    if (gameState !== 'user') return;
    
    // Play tone and flash
    activatePad(color);
    userSequence.push(color);
    
    // Verify sequence index
    const currentIndex = userSequence.length - 1;
    
    if (userSequence[currentIndex] !== sequence[currentIndex]) {
      // Game Over / Sequence Mismatch
      triggerGameError();
      return;
    }
    
    // If user matches current step and reaches sequence end
    if (userSequence.length === sequence.length) {
      triggerLevelComplete();
    }
  }

  // Level complete / Success sequence
  function triggerLevelComplete() {
    gameState = 'watch';
    boardContainer.style.pointerEvents = 'none';
    
    playSuccessChime();
    logTerminal('UPLINK STABLE! INCREMENTING PROTOCOL...', 'sys');

    // Visual page flash green
    gameWrapper.classList.add('screen-green-flash');
    setTimeout(() => {
      gameWrapper.classList.remove('screen-green-flash');
    }, 500);

    // Score & Level increment
    score += level * (gameMode === 'advanced' ? 20 : 10); // 20 XP in Advanced, 10 XP in Normal
    level++;
    
    // Update stats HUD
    levelVal.textContent = String(level).padStart(2, '0');
    scoreVal.textContent = String(score).padStart(3, '0');

    // Generate next step and replay
    nextSequenceStep();
    setTimeout(() => {
      if (gameState !== 'paused') {
        playSequence();
      }
    }, 1200);
  }

  // Mismatch error handling
  function triggerGameError() {
    gameState = 'over';
    boardContainer.style.pointerEvents = 'none';
    
    playErrorBuzzer();
    logTerminal('DECRYPT_KEY_ERROR! DISCONNECTING...', 'err');

    // Visual page shake and red flash
    gameWrapper.classList.add('shake-container');
    gameWrapper.classList.add('screen-red-flash');
    
    setTimeout(() => {
      gameWrapper.classList.remove('shake-container');
      gameWrapper.classList.remove('screen-red-flash');
    }, 500);

    // Update Best score if applicable
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('neon_best_score', bestScore);
      bestVal.textContent = String(bestScore).padStart(3, '0');
      logTerminal('NEW PERSONAL HIGH STREAK ESTABLISHED!', 'sys');
    }

    // Reset button states
    centerStartBtn.classList.remove('playing');
    startBtnText.textContent = 'RETRY';
    playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
  }

  // Reset Game completely
  function resetGame() {
    sequence = [];
    userSequence = [];
    level = 1;
    score = 0;
    
    levelVal.textContent = '01';
    scoreVal.textContent = '000';
    
    centerStartBtn.classList.remove('playing');
    startBtnText.textContent = 'START';
    playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
    
    gameState = 'idle';
    boardContainer.style.pointerEvents = 'none';
  }

  // Register click event listeners for all 8 pads
  Object.keys(pads).forEach(color => {
    pads[color].addEventListener('mousedown', () => {
      if (gameState === 'user') {
        handlePadClick(color);
      }
    });
  });

  // MODE SWITCHER EVENT HANDLERS
  function setGameMode(mode) {
    if (gameMode === mode) return;
    initAudio();
    playTone(440, 'triangle', 0.15, 0.2); // mode switch chime
    
    gameMode = mode;
    resetGame();
    
    if (gameMode === 'advanced') {
      modeNormalBtn.classList.remove('active');
      modeAdvancedBtn.classList.add('active');
      
      gameBoard.classList.add('advanced');
      activePool = ['green', 'cyan', 'blue', 'orange', 'red', 'yellow', 'pink', 'purple'];
      logTerminal('ADVANCED ARENA ALLOCATED (8-PADS Chromatic).', 'sys');
    } else {
      modeAdvancedBtn.classList.remove('active');
      modeNormalBtn.classList.add('active');
      
      gameBoard.classList.remove('advanced');
      activePool = ['green', 'blue', 'yellow', 'purple'];
      logTerminal('NORMAL ARENA DEPLOYED (4-PADS Diatonic).', 'sys');
    }
  }

  modeNormalBtn.addEventListener('click', () => setGameMode('normal'));
  modeAdvancedBtn.addEventListener('click', () => setGameMode('advanced'));

  // START / RETRY Button Click
  centerStartBtn.addEventListener('click', () => {
    initAudio();
    if (gameState !== 'idle' && gameState !== 'over') return;
    
    // Reset stats
    level = 1;
    score = 0;
    sequence = [];
    userSequence = [];
    
    levelVal.textContent = '01';
    scoreVal.textContent = '000';
    
    // Update center button UI
    centerStartBtn.classList.add('playing');
    startBtnText.textContent = 'PLAYING';
    
    // Replace play triangle icon with loading spinner
    playIcon.innerHTML = `<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>`;
    
    // Initialize sequence
    nextSequenceStep();
    
    // Small buffer delay to calibrate link
    logTerminal('ESTABLISHING INTERFACE SYNC...', 'sys');
    setTimeout(() => {
      playSequence();
    }, 1000);
  });

  // Restart Button
  restartBtn.addEventListener('click', () => {
    initAudio();
    logTerminal('RE-INITIALIZING GAME NEON-CORE...', 'sys');
    resetGame();
  });

  // Audio Mute toggle
  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    
    if (isMuted) {
      muteBtn.innerHTML = `
        <svg id="muteIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v6a3 3 0 0 0 3 3h1.586l4.707 4.707A1 1 0 0 0 20 22V4a1 1 0 0 0-1.707-.707L13.586 8H12a3 3 0 0 0-3 3z"/></svg>
        AUDIO_MUTED
      `;
      muteBtn.style.color = 'var(--neon-red)';
      muteBtn.style.borderColor = 'var(--neon-red)';
    } else {
      muteBtn.innerHTML = `
        <svg id="muteIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        AUDIO_ON
      `;
      muteBtn.style.color = '';
      muteBtn.style.borderColor = '';
    }
  });

  // Pause toggle handlers
  function togglePause() {
    if (gameState === 'idle' || gameState === 'over') return;
    
    if (gameState !== 'paused') {
      // PAUSE game
      previousState = gameState;
      gameState = 'paused';
      pauseOverlay.classList.remove('hidden');
      
      pauseBtn.innerHTML = `
        <svg id="pauseIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        RESUME_GAME
      `;
      pauseBtn.style.color = 'var(--neon-yellow)';
      pauseBtn.style.borderColor = 'var(--neon-yellow)';
      logTerminal('PROTOCOL PAUSED. STANDBY...', 'sys');
    } else {
      // RESUME game
      gameState = previousState;
      pauseOverlay.classList.add('hidden');
      
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
});
