(function () {
  'use strict';

  /* ============================================
     CONFIG
     ============================================ */
  const CITIES = {
    cdmx: { name: 'CDMX', img: 'cities/cdmx.png', flag: '🇲🇽' },
    puebla: { name: 'Puebla', img: 'cities/puebla.png', flag: '🇲🇽' },
    guadalajara: { name: 'Guadalajara', img: 'cities/guadalajara.png', flag: '🇲🇽' },
    monterrey: { name: 'Monterrey', img: 'cities/monterrey.png', flag: '🇲🇽' },
    oaxaca: { name: 'Oaxaca', img: 'cities/oaxaca.png', flag: '🇲🇽' },
    edomex: { name: 'EdoMex', img: 'cities/cdmx.png', flag: '🇲🇽' }, // fallback
    tlaxcala: { name: 'Tlaxcala', img: 'cities/puebla.png', flag: '🇲🇽' },
    morelos: { name: 'Morelos', img: 'cities/puebla.png', flag: '🇲🇽' },
    hidalgo: { name: 'Hidalgo', img: 'cities/cdmx.png', flag: '🇲🇽' },
    queretaro: { name: 'Querétaro', img: 'cities/cdmx.png', flag: '🇲🇽' },
    jalisco: { name: 'Jalisco', img: 'cities/guadalajara.png', flag: '🇲🇽' },
    michoacan: { name: 'Michoacán', img: 'cities/guadalajara.png', flag: '🇲🇽' },
    colima: { name: 'Colima', img: 'cities/guadalajara.png', flag: '🇲🇽' },
    nayarit: { name: 'Nayarit', img: 'cities/guadalajara.png', flag: '🇲🇽' },
    aguascalientes: { name: 'Aguascalientes', img: 'cities/guadalajara.png', flag: '🇲🇽' },
    guanajuato: { name: 'Guanajuato', img: 'cities/guadalajara.png', flag: '🇲🇽' },
    zacatecas: { name: 'Zacatecas', img: 'cities/guadalajara.png', flag: '🇲🇽' },
    san_luis_potosi: { name: 'San Luis Potosí', img: 'cities/monterrey.png', flag: '🇲🇽' },
    nuevo_leon: { name: 'Nuevo León', img: 'cities/monterrey.png', flag: '🇲🇽' },
    coahuila: { name: 'Coahuila', img: 'cities/monterrey.png', flag: '🇲🇽' },
    chihuahua: { name: 'Chihuahua', img: 'cities/monterrey.png', flag: '🇲🇽' },
    sonora: { name: 'Sonora', img: 'cities/monterrey.png', flag: '🇲🇽' },
    tamaulipas: { name: 'Tamaulipas', img: 'cities/monterrey.png', flag: '🇲🇽' },
    durango: { name: 'Durango', img: 'cities/monterrey.png', flag: '🇲🇽' },
    sinaloa: { name: 'Sinaloa', img: 'cities/guadalajara.png', flag: '🇲🇽' },
    baja_california: { name: 'Baja California', img: 'cities/monterrey.png', flag: '🇲🇽' },
    baja_california_sur: { name: 'Baja California Sur', img: 'cities/monterrey.png', flag: '🇲🇽' },
    guerrero: { name: 'Guerrero', img: 'cities/oaxaca.png', flag: '🇲🇽' },
    chiapas: { name: 'Chiapas', img: 'cities/oaxaca.png', flag: '🇲🇽' },
    veracruz: { name: 'Veracruz', img: 'cities/oaxaca.png', flag: '🇲🇽' },
    tabasco: { name: 'Tabasco', img: 'cities/oaxaca.png', flag: '🇲🇽' },
    campeche: { name: 'Campeche', img: 'cities/oaxaca.png', flag: '🇲🇽' },
    yucatan: { name: 'Yucatán', img: 'cities/oaxaca.png', flag: '🇲🇽' },
    quintana_roo: { name: 'Quintana Roo', img: 'cities/oaxaca.png', flag: '🇲🇽' }
  };

  const socket = io(); // Connect to Socket.IO server

  /* ============================================
     STATE
     ============================================ */
  let user = { name: '', age: 0, gender: '', city: '' };
  let opponent = { name: '', city: '', gender: '' };
  let rpsScore = { you: 0, opp: 0 };
  let idleTimer = null;
  let currentScreen = 'login';
  let isTyping = false;
  let typingTimeout = null;

  /* ============================================
     DOM REFS
     ============================================ */
  const $ = id => document.getElementById(id);

  // Login
  const formEl = $('connect-form');
  const nameInput = $('input-name');
  const ageInput = $('input-age');
  const genderInput = $('input-gender');
  const cityInput = $('input-city');
  const errorMsg = $('error-message');
  const btnSearch = $('btn-search');
  const btnCancelSearch = $('btn-cancel-search');
  const checkName = $('check-name');
  const checkAge = $('check-age');
  const checkCity = $('check-city');

  // Chat
  const chatBgImg = $('chat-bg-img');
  const topbarName = $('topbar-name');
  const topbarCity = $('topbar-city');
  const chatMessages = $('chat-messages');
  const chatInput = $('chat-input');
  const btnSend = $('btn-send');
  const btnDisconnect = $('btn-disconnect');
  const stkLeft = $('stickman-left');
  const stkRight = $('stickman-right');
  const stkLeftLabel = $('stickman-left-label');
  const stkRightLabel = $('stickman-right-label');
  const typingIndicator = $('typing-indicator');
  const typingName = $('typing-name');
  const statusText = $('status-text');

  // RPS
  const rpsModal = $('rps-modal');
  const rpsClose = $('rps-close');
  const rpsHandYou = $('rps-hand-you');
  const rpsHandOpp = $('rps-hand-opp');
  const rpsResult = $('rps-result');
  const rpsPlayAgain = $('rps-play-again');
  const rpsScoreYou = $('rps-score-you');
  const rpsScoreOpp = $('rps-score-opp');
  const rpsSubtitle = $('rps-subtitle');
  const rpsScoreOppLabel = $('rps-score-opp-label');

  /* ============================================
     PARTICLES
     ============================================ */
  (function createParticles() {
    const container = $('bg-particles');
    for (let i = 0; i < 20; i++) {
      let p = document.createElement('div');
      p.classList.add('particle');
      p.style.left = Math.random() * 100 + '%';
      p.style.width = (Math.random() * 3 + 1) + 'px';
      p.style.height = p.style.width;
      p.style.animationDuration = (Math.random() * 12 + 8) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      container.appendChild(p);
    }
  })();

  /* ============================================
     SCREEN TRANSITIONS
     ============================================ */
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => {
      if (s.classList.contains('active')) {
        s.classList.remove('active');
        s.classList.add('exit');
        setTimeout(() => s.classList.remove('exit'), 600);
      }
    });
    setTimeout(() => {
      const target = $('screen-' + name);
      if (target) {
        target.classList.add('active');
        currentScreen = name;
      }
    }, 100);
  }

  /* ============================================
     LOGIN FORM
     ============================================ */
  const genderBtns = [$('btn-hombre'), $('btn-mujer')];
  genderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      genderBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      genderInput.value = btn.getAttribute('data-gender');
      clearFieldError('input-group-gender');
      hideError();
    });
  });

  nameInput.addEventListener('input', () => {
    toggleCheck(checkName, nameInput.value.trim().length > 0);
    clearFieldError('input-group-name'); hideError();
  });
  ageInput.addEventListener('input', () => {
    let v = ageInput.value.trim();
    let a = parseInt(v, 10);
    toggleCheck(checkAge, v.length > 0 && a >= 13 && a <= 99);
    clearFieldError('input-group-age'); hideError();
  });
  cityInput.addEventListener('change', () => {
    toggleCheck(checkCity, cityInput.value !== '');
    clearFieldError('input-group-city'); hideError();
  });

  function toggleCheck(el, show) { el.classList[show ? 'add' : 'remove']('visible'); }
  function clearFieldError(id) { $(id).classList.remove('has-error'); }
  function showError() { errorMsg.classList.add('visible'); }
  function hideError() { errorMsg.classList.remove('visible'); }

  function validateAll() {
    let ok = true;
    if (!nameInput.value.trim()) { $('input-group-name').classList.add('has-error'); ok = false; }
    let age = parseInt(ageInput.value.trim(), 10);
    if (!ageInput.value.trim() || isNaN(age) || age < 13 || age > 99) { $('input-group-age').classList.add('has-error'); ok = false; }
    if (!genderInput.value) { $('input-group-gender').classList.add('has-error'); ok = false; }
    if (!cityInput.value) { $('input-group-city').classList.add('has-error'); ok = false; }
    return ok;
  }

  // Ripple
  btnSearch.addEventListener('click', e => {
    let rect = btnSearch.getBoundingClientRect();
    let rp = document.createElement('span');
    rp.classList.add('ripple');
    let sz = Math.max(rect.width, rect.height);
    rp.style.width = rp.style.height = sz + 'px';
    rp.style.left = (e.clientX - rect.left - sz / 2) + 'px';
    rp.style.top = (e.clientY - rect.top - sz / 2) + 'px';
    btnSearch.appendChild(rp);
    rp.addEventListener('animationend', () => rp.remove());
  });

  formEl.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateAll()) {
      showError();
      let card = $('main-card');
      card.style.animation = 'none'; void card.offsetHeight;
      card.style.animation = 'shakeCard 0.5s ease';
      return;
    }
    user.name = nameInput.value.trim();
    user.age = parseInt(ageInput.value.trim(), 10);
    user.gender = genderInput.value;
    user.city = cityInput.value;

    socket.emit('user:join', user);
    socket.emit('user:search');
    showScreen('searching');
  });

  btnCancelSearch.addEventListener('click', () => {
    socket.emit('user:cancel-search');
    showScreen('login');
  });

  /* ============================================
     SOCKET EVENTS
     ============================================ */
  socket.on('match:found', data => {
    opponent = data;
    startChat();
  });

  socket.on('chat:message', data => {
    addBubble(data.text, 'theirs', data.time);
    setCharState(stkRight, 'jumping');
    setTimeout(() => setCharState(stkRight, 'idle'), 700);
    resetIdleTimer();
    typingIndicator.style.display = 'none';
  });

  socket.on('chat:typing', data => {
    if (data.isTyping) {
      typingName.textContent = data.name;
      typingIndicator.style.display = 'block';
      setCharState(stkRight, 'running');
    } else {
      typingIndicator.style.display = 'none';
      setCharState(stkRight, 'idle');
    }
    resetIdleTimer();
  });

  socket.on('chat:partner-left', data => {
    addSystemMsg(`${data.name} se ha desconectado.`);
    statusText.textContent = 'Desconectado';
    statusText.style.color = '#ff8a80';
    $('chat-topbar').querySelector('.status-dot').style.background = '#ff8a80';
    $('chat-topbar').querySelector('.status-dot').style.boxShadow = 'none';
    chatInput.disabled = true;
    btnSend.disabled = true;
    $('btn-rps').disabled = true;
    setCharState(stkRight, 'sad');
    closeRPS();
  });

  /* ============================================
     CHAT
     ============================================ */
  function startChat() {
    showScreen('chat');

    let oppCity = CITIES[opponent.city] || CITIES['cdmx'];
    chatBgImg.style.backgroundImage = "url('" + oppCity.img + "')";

    topbarName.textContent = opponent.name;
    topbarCity.textContent = `📍 ${oppCity.name} ${oppCity.flag}`;
    statusText.textContent = 'En línea';
    statusText.style.color = 'var(--accent)';
    $('chat-topbar').querySelector('.status-dot').style.background = 'var(--accent)';
    $('chat-topbar').querySelector('.status-dot').style.boxShadow = '0 0 8px var(--accent-glow)';
    
    chatInput.disabled = false;
    btnSend.disabled = false;
    $('btn-rps').disabled = false;

    stkLeftLabel.textContent = user.name;
    stkRightLabel.textContent = opponent.name;

    rpsScore = { you: 0, opp: 0 };
    rpsScoreYou.textContent = '0';
    rpsScoreOpp.textContent = '0';
    rpsScoreOppLabel.textContent = opponent.name;

    chatMessages.innerHTML = '';
    addSystemMsg(`¡Conectados! Saluda a ${opponent.name} de ${oppCity.name} 👋`);

    setCharState(stkLeft, 'idle');
    setCharState(stkRight, 'idle');
    resetIdleTimer();
  }

  function sendMessage() {
    let text = chatInput.value.trim();
    if (!text) return;

    socket.emit('chat:message', { text });
    addBubble(text, 'mine', new Date().toISOString());
    chatInput.value = '';

    socket.emit('chat:typing', false);
    isTyping = false;

    setCharState(stkLeft, 'jumping');
    setTimeout(() => setCharState(stkLeft, 'idle'), 700);
    resetIdleTimer();
  }

  btnSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
  });

  chatInput.addEventListener('input', () => {
    if (!isTyping) {
      isTyping = true;
      socket.emit('chat:typing', true);
    }
    setCharState(stkLeft, 'running');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      socket.emit('chat:typing', false);
      setCharState(stkLeft, 'idle');
    }, 1000);
    resetIdleTimer();
  });

  function addBubble(text, type, timeIso) {
    let bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', type);
    let d = timeIso ? new Date(timeIso) : new Date();
    let timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    bubble.innerHTML = text + '<span class="bubble-time">' + timeStr + '</span>';
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addSystemMsg(text) {
    let msg = document.createElement('div');
    msg.classList.add('chat-system-msg');
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /* ============================================
     CHARACTER STATES
     ============================================ */
  const STATES = ['idle', 'jumping', 'running', 'sitting', 'sitting-tree', 'sitting-bench-l', 'sitting-bench-r', 'celebrating', 'sad'];

  function setCharState(el, state) {
    STATES.forEach(s => el.classList.remove(s));
    el.classList.add(state);
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    stkLeft.style.left = ''; stkLeft.style.right = '';
    stkRight.style.left = ''; stkRight.style.right = '';
    idleTimer = setTimeout(() => {
      if (currentScreen !== 'chat') return;
      setCharState(stkLeft, 'sitting');
      stkLeft.classList.add('sitting-tree');
      setCharState(stkRight, 'sitting');
      stkRight.classList.add('sitting-bench-r');
    }, 15000);
  }

  btnDisconnect.addEventListener('click', () => {
    socket.emit('chat:disconnect');
    clearTimeout(idleTimer);
    addSystemMsg('Te has desconectado.');
    setTimeout(() => showScreen('login'), 800);
  });

  /* ============================================
     ROCK PAPER SCISSORS
     ============================================ */
  const RPS_EMOJIS = { piedra: '✊', papel: '✋', tijera: '✌️' };

  $('btn-rps').addEventListener('click', openRPS);
  rpsClose.addEventListener('click', closeRPS);
  rpsModal.addEventListener('click', e => { if (e.target === rpsModal) closeRPS(); });

  function openRPS() {
    rpsModal.classList.add('active');
    resetRPSRound();
  }
  function closeRPS() { rpsModal.classList.remove('active'); }

  function resetRPSRound() {
    rpsHandYou.textContent = '❓';
    rpsHandOpp.textContent = '❓';
    rpsResult.textContent = '';
    rpsResult.className = 'rps-result';
    rpsSubtitle.textContent = '¡Elige tu jugada!';
    rpsPlayAgain.style.display = 'none';
    document.querySelectorAll('.rps-choice').forEach(c => {
      c.classList.remove('selected');
      c.disabled = false;
    });
  }

  document.querySelectorAll('.rps-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      let choice = btn.getAttribute('data-choice');
      socket.emit('rps:play', { choice });
      rpsHandYou.textContent = RPS_EMOJIS[choice];
      rpsSubtitle.textContent = 'Esperando a ' + opponent.name + '...';
      document.querySelectorAll('.rps-choice').forEach(c => {
        c.classList.remove('selected');
        c.disabled = true;
      });
      btn.classList.add('selected');
    });
  });

  socket.on('rps:opponent-ready', data => {
    if (rpsHandYou.textContent === '❓') {
      rpsSubtitle.textContent = `${data.name} ya eligió. ¡Te toca!`;
    }
    rpsHandOpp.textContent = '🤔';
  });

  socket.on('rps:result', data => {
    rpsHandOpp.textContent = RPS_EMOJIS[data.oppChoice];
    rpsHandOpp.classList.add('reveal');
    rpsHandYou.classList.add('reveal');
    setTimeout(() => {
      rpsHandOpp.classList.remove('reveal');
      rpsHandYou.classList.remove('reveal');
    }, 500);

    if (data.result === 'draw') {
      rpsResult.textContent = '🤝 ¡Empate!';
      rpsResult.className = 'rps-result draw';
      addSystemMsg(`🎮 PPT: Empate ${RPS_EMOJIS[data.yourChoice]} vs ${RPS_EMOJIS[data.oppChoice]}`);
    } else if (data.result === 'win') {
      rpsScore.you++;
      rpsScoreYou.textContent = rpsScore.you;
      rpsResult.textContent = '🎉 ¡Ganaste!';
      rpsResult.className = 'rps-result win';
      setCharState(stkLeft, 'celebrating');
      setTimeout(() => setCharState(stkLeft, 'idle'), 2000);
      addSystemMsg(`🎮 ¡Ganaste! ${RPS_EMOJIS[data.yourChoice]} vence a ${RPS_EMOJIS[data.oppChoice]}`);
    } else {
      rpsScore.opp++;
      rpsScoreOpp.textContent = rpsScore.opp;
      rpsResult.textContent = '😢 Perdiste...';
      rpsResult.className = 'rps-result lose';
      setCharState(stkRight, 'celebrating');
      setTimeout(() => setCharState(stkRight, 'idle'), 2000);
      addSystemMsg(`🎮 ${data.oppName} ganó. ${RPS_EMOJIS[data.oppChoice]} vence a ${RPS_EMOJIS[data.yourChoice]}`);
    }

    rpsSubtitle.textContent = `${RPS_EMOJIS[data.yourChoice]} vs ${RPS_EMOJIS[data.oppChoice]}`;
    rpsPlayAgain.style.display = 'inline-block';
  });

  rpsPlayAgain.addEventListener('click', () => {
    socket.emit('rps:reset');
    resetRPSRound();
  });

})();
