/**
 * TaskFlow ✨ 3-Column Modern Workspace
 * [Left: Notes] [Center: To-Do with + Sign] [Right: Completed Tasks]
 * Initial Profile Onboarding • 3 Light & 3 Dark Themes • LocalStorage Persistence
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. CONSTANTS & STORAGE KEYS
  // -------------------------------------------------------------------------
  const STORAGE_KEYS = {
    TASKS: 'taskflow_v4_tasks',
    NOTES: 'taskflow_v4_notes',
    PROFILE: 'taskflow_v4_profile',
    THEME: 'taskflow_v4_theme',
    SOUND: 'taskflow_v4_sound',
    ONBOARDED: 'taskflow_v4_onboarded'
  };

  const THEME_NAMES = {
    'light-pure': 'Pure Light',
    'light-linen': 'Warm Linen',
    'light-blush': 'Blush Pastel',
    'dark-obsidian': 'Obsidian Dark',
    'dark-oled': 'Midnight OLED',
    'dark-cosmic': 'Cosmic Indigo'
  };

  // -------------------------------------------------------------------------
  // 2. STATE MANAGEMENT
  // -------------------------------------------------------------------------
  let state = {
    tasks: [],
    notes: [],
    profile: {
      name: '',
      tagline: 'Taking it one peaceful step at a time ✨',
      avatar: '😊',
      streak: 1,
      completedCount: 0
    },
    theme: 'light-pure', // Default Light
    soundEnabled: true,
    activeFilter: 'all',
    activeCategory: 'all',
    searchQuery: '',
    alertedTaskIds: new Set(),
    lastDeletedTask: null,
    undoTimeoutId: null
  };

  // -------------------------------------------------------------------------
  // 3. AUDIO FEEDBACK (WEB AUDIO API)
  // -------------------------------------------------------------------------
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;

      if (type === 'complete') {
        // Soft joyful arpeggio chime (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.001, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.32);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.34);
        });
      } else if (type === 'reminder') {
        // Gentle double ping
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174.66, now + 0.12);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'click') {
        // Subtle soft click
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      console.warn('Audio playback warning:', e);
    }
  }

  // -------------------------------------------------------------------------
  // 4. CONFETTI CELEBRATION
  // -------------------------------------------------------------------------
  const confettiCanvas = document.getElementById('confetti-canvas');
  let confettiCtx = null;
  let confettiParticles = [];
  let confettiAnimationId = null;

  function resizeConfetti() {
    if (confettiCanvas) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
  }
  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();

  function triggerCelebration() {
    if (!confettiCanvas) return;
    confettiCtx = confettiCanvas.getContext('2d');
    if (!confettiCtx) return;

    const colors = ['#2563eb', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#38bdf8'];
    const count = 45;
    confettiParticles = [];

    const originX = window.innerWidth * 0.55;
    const originY = window.innerHeight * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 4 + Math.random() * 7;
      confettiParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2.5,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.015
      });
    }

    if (!confettiAnimationId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    let activeCount = 0;
    for (let p of confettiParticles) {
      if (p.alpha > 0) {
        activeCount++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.vx *= 0.98;
        p.alpha -= p.decay;

        confettiCtx.save();
        confettiCtx.globalAlpha = Math.max(0, p.alpha);
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.fillStyle = p.color;
        confettiCtx.beginPath();
        confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        confettiCtx.fill();
        confettiCtx.restore();
      }
    }

    if (activeCount > 0) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiAnimationId = null;
    }
  }

  // -------------------------------------------------------------------------
  // 5. TOAST NOTIFICATIONS
  // -------------------------------------------------------------------------
  const toastContainer = document.getElementById('toast-container');

  function showToast(message, icon = '✨', actionLabel = null, onAction = null) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast-box';

    const content = document.createElement('div');
    content.className = 'toast-content';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-ico';
    iconSpan.textContent = icon;

    const textSpan = document.createElement('span');
    textSpan.className = 'toast-txt';
    textSpan.textContent = message;

    content.appendChild(iconSpan);
    content.appendChild(textSpan);
    toast.appendChild(content);

    if (actionLabel && onAction) {
      const undoBtn = document.createElement('button');
      undoBtn.className = 'toast-undo';
      undoBtn.textContent = actionLabel;
      undoBtn.addEventListener('click', () => {
        onAction();
        removeToast(toast);
      });
      toast.appendChild(undoBtn);
    }

    toastContainer.appendChild(toast);

    setTimeout(() => {
      removeToast(toast);
    }, 4500);
  }

  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }

  // -------------------------------------------------------------------------
  // 6. LOCAL STORAGE PERSISTENCE
  // -------------------------------------------------------------------------
  function loadFromStorage() {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (savedTasks) {
        state.tasks = JSON.parse(savedTasks);
      } else {
        seedInitialTasks();
      }

      const savedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (savedNotes) {
        state.notes = JSON.parse(savedNotes);
      } else {
        seedInitialNotes();
      }

      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        state.profile = Object.assign(state.profile, JSON.parse(savedProfile));
      }

      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme && THEME_NAMES[savedTheme]) {
        state.theme = savedTheme;
      } else {
        state.theme = 'light-pure';
      }

      const savedSound = localStorage.getItem(STORAGE_KEYS.SOUND);
      if (savedSound !== null) {
        state.soundEnabled = JSON.parse(savedSound);
      }
    } catch (e) {
      console.warn('Storage parsing error:', e);
      seedInitialTasks();
      seedInitialNotes();
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  }

  function saveNotes() {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(state.notes));
    } catch (e) {
      console.error('Failed to save notes:', e);
    }
  }

  function saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(state.profile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  }

  function saveTheme() {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  }

  function saveSound() {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(state.soundEnabled));
    } catch (e) {
      console.error('Failed to save sound preference:', e);
    }
  }

  function seedInitialTasks() {
    const todayStr = new Date().toISOString().split('T')[0];
    state.tasks = [
      {
        id: 'task-1',
        title: 'Review Chapter 4 notes for tomorrow',
        description: 'Check formulas, summary questions and flashcards',
        category: 'Study',
        priority: 'high',
        dueDate: todayStr,
        dueTime: '17:00',
        sticker: '📚',
        highlighted: true,
        reminder: true,
        completed: false,
        completedAt: null,
        createdAt: Date.now() - 3600000
      },
      {
        id: 'task-2',
        title: 'Pick up fresh groceries & fruit for dinner',
        description: 'Milk, oats, bananas, coffee, and bread',
        category: 'Shopping',
        priority: 'medium',
        dueDate: todayStr,
        dueTime: '19:30',
        sticker: '🛒',
        highlighted: false,
        reminder: true,
        completed: false,
        completedAt: null,
        createdAt: Date.now() - 7200000
      },
      {
        id: 'task-3',
        title: 'Take a 20-minute evening walk outside',
        description: 'Relax, stretch, and disconnect from screens',
        category: 'Health',
        priority: 'low',
        dueDate: '',
        dueTime: '',
        sticker: '🏃',
        highlighted: true,
        reminder: false,
        completed: false,
        completedAt: null,
        createdAt: Date.now() - 10800000
      }
    ];
    saveTasks();
  }

  function seedInitialNotes() {
    state.notes = [
      {
        id: 'note-1',
        text: '🧺 Weekend plan: Farmers market on Saturday morning and picnic with family!',
        color: 'yellow',
        pinned: true,
        createdAt: Date.now() - 3600000
      },
      {
        id: 'note-2',
        text: '📖 Book recommendation: "Atomic Habits" by James Clear',
        color: 'blue',
        pinned: false,
        createdAt: Date.now() - 7200000
      }
    ];
    saveNotes();
  }

  // -------------------------------------------------------------------------
  // 7. TIME & DUE DATE FORMATTING
  // -------------------------------------------------------------------------
  function formatDueDisplay(dueDate, dueTime) {
    if (!dueDate) return null;

    const dueDateTimeStr = dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T23:59:59`;
    const dueDateObj = new Date(dueDateTimeStr);
    if (isNaN(dueDateObj.getTime())) return null;

    const now = new Date();
    const diffMs = dueDateObj.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    let label = '';
    let status = 'future';

    if (diffMs < 0) {
      status = 'overdue';
      const overdueMins = Math.abs(diffMins);
      if (overdueMins < 60) {
        label = `Overdue ${overdueMins}m ⚠️`;
      } else if (Math.abs(diffHours) < 24) {
        label = `Overdue ${Math.abs(diffHours)}h ⚠️`;
      } else {
        label = `Overdue ${Math.abs(diffDays)}d ⚠️`;
      }
    } else if (diffMins <= 30) {
      status = 'due-soon';
      label = `Due in ${diffMins}m ⏰`;
    } else if (dueDateObj.toDateString() === now.toDateString()) {
      status = 'due-soon';
      const timeFormatted = dueDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      label = `Today ${dueTime ? 'at ' + timeFormatted : ''}`;
    } else {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      if (dueDateObj.toDateString() === tomorrow.toDateString()) {
        label = `Tomorrow ${dueTime ? 'at ' + dueTime : ''}`;
      } else {
        label = dueDateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) + (dueTime ? ` ${dueTime}` : '');
      }
    }

    return { label, status, dueDateObj };
  }

  function checkReminders() {
    state.tasks.forEach(task => {
      if (task.completed || !task.reminder || !task.dueDate) return;

      const dueInfo = formatDueDisplay(task.dueDate, task.dueTime);
      if (!dueInfo) return;

      if ((dueInfo.status === 'due-soon' || dueInfo.status === 'overdue') && !state.alertedTaskIds.has(task.id)) {
        state.alertedTaskIds.add(task.id);
        playSound('reminder');
        showToast(`Reminder: "${task.title.slice(0, 24)}" is ${dueInfo.status === 'overdue' ? 'overdue!' : 'due soon!'}`, '⏰');
      }
    });
  }

  // -------------------------------------------------------------------------
  // 8. TEXT SEARCH & HIGHLIGHTING
  // -------------------------------------------------------------------------
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightMatch(text, query) {
    if (!query || !text) return escapeHTML(text);
    const escapedText = escapeHTML(text);
    const escapedQuery = escapeRegex(query.trim());
    if (!escapedQuery) return escapedText;

    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------------------
  // 9. RENDERING UI
  // -------------------------------------------------------------------------
  const activeTasksListEl = document.getElementById('active-tasks-list');
  const completedTasksListEl = document.getElementById('completed-tasks-list');
  const emptyTasksStateEl = document.getElementById('empty-tasks-state');
  const emptyCompletedStateEl = document.getElementById('empty-completed-state');
  const stickyNotesGridEl = document.getElementById('sticky-notes-grid');
  const emptyStickyStateEl = document.getElementById('empty-sticky-state');

  // Counts & Progress
  const progressBarFillEl = document.getElementById('progress-bar-fill');
  const progressPercentageLabelEl = document.getElementById('progress-percentage-label');
  const countAllEl = document.getElementById('count-all');
  const countPendingEl = document.getElementById('count-pending');
  const countHighlightedEl = document.getElementById('count-highlighted');
  const countTodayEl = document.getElementById('count-today');
  const completedCollapsibleCountEl = document.getElementById('completed-collapsible-count');
  const notesBadgeCountEl = document.getElementById('notes-badge-count');

  // Nav & Header Elements
  const navAvatarPreviewEl = document.getElementById('nav-avatar-preview');
  const navUserNameEl = document.getElementById('nav-user-name');
  const currentThemeLabelEl = document.getElementById('current-theme-label');
  const todayDateStringEl = document.getElementById('today-date-string');
  const focusGreetingEl = document.getElementById('focus-greeting');
  const focusMottoEl = document.getElementById('focus-motto');
  const focusPendingCountEl = document.getElementById('focus-pending-count');
  const focusHighlightCountEl = document.getElementById('focus-highlight-count');
  const focusCompletionCountEl = document.getElementById('focus-completion-count');

  function renderAll() {
    renderTasks();
    renderCompletedTasks();
    renderNotes();
    renderStats();
    renderHeader();
  }

  function renderHeader() {
    if (navAvatarPreviewEl) navAvatarPreviewEl.textContent = state.profile.avatar || '😊';
    if (navUserNameEl) navUserNameEl.textContent = state.profile.name || 'User';
    if (currentThemeLabelEl) currentThemeLabelEl.textContent = THEME_NAMES[state.theme] || 'Pure Light';
    if (focusGreetingEl) {
      const firstName = (state.profile.name || '').trim().split(/\s+/)[0];
      focusGreetingEl.textContent = firstName ? `Good to see you, ${firstName}.` : 'Make today count.';
    }
    if (focusMottoEl) {
      focusMottoEl.textContent = state.profile.tagline || 'A calm plan makes room for good work.';
    }

    if (todayDateStringEl) {
      const now = new Date();
      todayDateStringEl.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
  }

  function renderStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const todayStr = new Date().toISOString().split('T')[0];
    const highlightedCount = state.tasks.filter(t => !t.completed && t.highlighted).length;
    const todayCount = state.tasks.filter(t => !t.completed && t.dueDate === todayStr).length;

    if (countAllEl) countAllEl.textContent = total;
    if (countPendingEl) countPendingEl.textContent = pending;
    if (countHighlightedEl) countHighlightedEl.textContent = highlightedCount;
    if (countTodayEl) countTodayEl.textContent = todayCount;
    if (completedCollapsibleCountEl) completedCollapsibleCountEl.textContent = completed;
    if (notesBadgeCountEl) notesBadgeCountEl.textContent = state.notes.length;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    if (progressBarFillEl) progressBarFillEl.style.width = `${percentage}%`;
    if (progressPercentageLabelEl) progressPercentageLabelEl.textContent = `${percentage}%`;
    if (focusPendingCountEl) focusPendingCountEl.textContent = pending;
    if (focusHighlightCountEl) focusHighlightCountEl.textContent = highlightedCount;
    if (focusCompletionCountEl) focusCompletionCountEl.textContent = `${percentage}%`;

    // Profile modal numbers
    const profileStatCompleted = document.getElementById('profile-stat-completed');
    const profileStatStreak = document.getElementById('profile-stat-streak');
    const profileStatScore = document.getElementById('profile-stat-score');

    if (profileStatCompleted) profileStatCompleted.textContent = completed;
    if (profileStatStreak) profileStatStreak.textContent = state.profile.streak || 1;
    if (profileStatScore) profileStatScore.textContent = (completed * 10) + (state.profile.streak * 5);
  }

  // =========================================================================
  // CENTER COLUMN: ACTIVE TASKS RENDERING
  // =========================================================================
  function getFilteredActiveTasks() {
    const query = state.searchQuery.trim().toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];

    return state.tasks.filter(task => {
      if (task.completed) return false; // Center is strictly Active Tasks

      if (state.activeFilter === 'highlighted' && !task.highlighted) return false;
      if (state.activeFilter === 'today' && task.dueDate !== todayStr) return false;

      if (state.activeCategory !== 'all' && task.category !== state.activeCategory) return false;

      if (query) {
        const titleMatch = (task.title || '').toLowerCase().includes(query);
        const descMatch = (task.description || '').toLowerCase().includes(query);
        const catMatch = (task.category || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      // Highlighted tasks always float to top in To-Do list
      if (a.highlighted && !b.highlighted) return -1;
      if (!a.highlighted && b.highlighted) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  function renderTasks() {
    if (!activeTasksListEl) return;
    const activeTasks = getFilteredActiveTasks();

    activeTasksListEl.innerHTML = '';

    activeTasks.forEach(task => {
      activeTasksListEl.appendChild(createActiveTaskCard(task));
    });

    if (activeTasks.length === 0) {
      emptyTasksStateEl.style.display = 'block';
    } else {
      emptyTasksStateEl.style.display = 'none';
    }
  }

  function createActiveTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.highlighted ? 'is-highlighted' : ''}`;
    card.dataset.id = task.id;

    // Checkbox
    const chkWrap = document.createElement('label');
    chkWrap.className = 'task-check-wrap';
    chkWrap.title = 'Mark as completed';

    const realChk = document.createElement('input');
    realChk.type = 'checkbox';
    realChk.className = 'task-real-check';
    realChk.checked = false;
    realChk.addEventListener('change', () => toggleComplete(task.id));

    const customChk = document.createElement('span');
    customChk.className = 'task-custom-check';

    chkWrap.appendChild(realChk);
    chkWrap.appendChild(customChk);
    card.appendChild(chkWrap);

    // Star Highlight Button
    const starBtn = document.createElement('button');
    starBtn.className = `btn-star-highlight ${task.highlighted ? 'active' : ''}`;
    starBtn.title = task.highlighted ? 'Remove highlight' : 'Highlight as Important';
    starBtn.innerHTML = task.highlighted ? '★' : '☆';
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleHighlight(task.id);
    });
    card.appendChild(starBtn);

    // Content Block
    const content = document.createElement('div');
    content.className = 'task-main-content';

    // Title Row
    const titleGroup = document.createElement('div');
    titleGroup.className = 'task-title-group';

    if (task.sticker) {
      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'task-optional-emoji';
      emojiSpan.textContent = task.sticker;
      titleGroup.appendChild(emojiSpan);
    }

    const titleText = document.createElement('span');
    titleText.className = 'task-title-text';
    titleText.innerHTML = highlightMatch(task.title, state.searchQuery);
    titleGroup.appendChild(titleText);
    content.appendChild(titleGroup);

    // Optional Description
    if (task.description) {
      const descText = document.createElement('div');
      descText.className = 'task-notes-text';
      descText.innerHTML = highlightMatch(task.description, state.searchQuery);
      content.appendChild(descText);
    }

    // Details Row (Priority, Category, Due Date)
    const detailsRow = document.createElement('div');
    detailsRow.className = 'task-details-row';

    const priorityNames = {
      critical: '🔥 Urgent',
      high: '⭐ High',
      medium: '🌿 Normal',
      low: '☕ Low'
    };
    if (task.priority === 'critical' || task.priority === 'high') {
      const pBadge = document.createElement('span');
      pBadge.className = `casual-badge b-${task.priority}`;
      pBadge.textContent = priorityNames[task.priority];
      detailsRow.appendChild(pBadge);
    }

    if (task.category) {
      const catBadge = document.createElement('span');
      catBadge.className = 'casual-badge b-category';
      catBadge.textContent = task.category;
      detailsRow.appendChild(catBadge);
    }

    if (task.dueDate) {
      const dueInfo = formatDueDisplay(task.dueDate, task.dueTime);
      if (dueInfo) {
        const dueBadge = document.createElement('span');
        dueBadge.className = `casual-badge b-due ${dueInfo.status}`;
        dueBadge.textContent = dueInfo.label;
        detailsRow.appendChild(dueBadge);
      }
    }

    if (task.highlighted) {
      const hlBadge = document.createElement('span');
      hlBadge.className = 'casual-badge b-highlighted';
      hlBadge.textContent = '⭐ Highlighted';
      detailsRow.appendChild(hlBadge);
    }

    if (task.reminder) {
      const remBadge = document.createElement('span');
      remBadge.className = 'casual-badge b-reminder';
      remBadge.title = 'Reminder chime active';
      remBadge.textContent = '🔔';
      detailsRow.appendChild(remBadge);
    }

    content.appendChild(detailsRow);
    card.appendChild(content);

    // Action Buttons
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-item-action';
    editBtn.title = 'Edit task';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => openEditTaskModal(task.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-item-action btn-item-delete';
    delBtn.title = 'Delete task';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    card.appendChild(actions);

    return card;
  }

  // =========================================================================
  // RIGHT COLUMN: COMPLETED TASKS RENDERING
  // =========================================================================
  function renderCompletedTasks() {
    if (!completedTasksListEl) return;
    const query = state.searchQuery.trim().toLowerCase();

    const completedTasks = state.tasks.filter(t => {
      if (!t.completed) return false;
      if (query) {
        const matchTitle = (t.title || '').toLowerCase().includes(query);
        const matchDesc = (t.description || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    }).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    completedTasksListEl.innerHTML = '';

    completedTasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'completed-item-card';

      const left = document.createElement('div');
      left.className = 'cic-left';

      const check = document.createElement('span');
      check.className = 'cic-check';
      check.textContent = '✓';

      const title = document.createElement('span');
      title.className = 'cic-title';
      title.innerHTML = highlightMatch(task.title, state.searchQuery);

      left.appendChild(check);
      left.appendChild(title);
      item.appendChild(left);

      const actions = document.createElement('div');
      actions.className = 'cic-actions';

      const restoreBtn = document.createElement('button');
      restoreBtn.className = 'btn-restore-task';
      restoreBtn.title = 'Restore to Active tasks';
      restoreBtn.textContent = '↩';
      restoreBtn.addEventListener('click', () => toggleComplete(task.id));

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-item-action btn-item-delete';
      delBtn.title = 'Delete permanently';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => deleteTask(task.id));

      actions.appendChild(restoreBtn);
      actions.appendChild(delBtn);
      item.appendChild(actions);

      completedTasksListEl.appendChild(item);
    });

    if (completedTasks.length === 0) {
      emptyCompletedStateEl.style.display = 'block';
    } else {
      emptyCompletedStateEl.style.display = 'none';
    }
  }

  // =========================================================================
  // LEFT COLUMN: NOTES RENDERING
  // =========================================================================
  function renderNotes() {
    if (!stickyNotesGridEl) return;
    const query = state.searchQuery.trim().toLowerCase();

    const filteredNotes = state.notes.filter(note => {
      if (query) {
        return (note.text || '').toLowerCase().includes(query);
      }
      return true;
    }).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    stickyNotesGridEl.innerHTML = '';

    filteredNotes.forEach(note => {
      const card = document.createElement('div');
      card.className = `note-card-item ${note.color || 'yellow'} ${note.pinned ? 'pinned' : ''}`;

      const actions = document.createElement('div');
      actions.className = 'note-card-actions';

      const pinBtn = document.createElement('span');
      pinBtn.className = `btn-pin ${note.pinned ? 'pinned' : ''}`;
      pinBtn.textContent = note.pinned ? '⭐ Pinned' : '☆ Pin';
      pinBtn.addEventListener('click', () => togglePinNote(note.id));

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete-note';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(note.id);
      });

      actions.appendChild(pinBtn);
      actions.appendChild(delBtn);
      card.appendChild(actions);

      const text = document.createElement('div');
      text.className = 'note-card-text';
      text.textContent = note.text;
      text.addEventListener('click', () => openEditNoteModal(note.id));
      card.appendChild(text);

      const date = document.createElement('div');
      date.className = 'note-card-date';
      date.textContent = note.createdAt ? new Date(note.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
      card.appendChild(date);

      stickyNotesGridEl.appendChild(card);
    });

    if (filteredNotes.length === 0) {
      emptyStickyStateEl.style.display = 'block';
    } else {
      emptyStickyStateEl.style.display = 'none';
    }
  }

  // -------------------------------------------------------------------------
  // 10. TASK & NOTE ACTIONS (CRUD)
  // -------------------------------------------------------------------------
  function addTask(data) {
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      category: data.category || 'Personal',
      priority: data.priority || 'medium',
      dueDate: data.dueDate || '',
      dueTime: data.dueTime || '',
      sticker: data.sticker || '',
      highlighted: !!data.highlighted,
      reminder: !!data.reminder,
      completed: false,
      completedAt: null,
      createdAt: Date.now()
    };

    state.tasks.unshift(newTask);
    saveTasks();
    renderAll();
    playSound('click');
    showToast(`Added to To-Do list: "${newTask.title.slice(0, 22)}..."`, '✨');
  }

  function updateTask(id, data) {
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;

    state.tasks[idx] = Object.assign(state.tasks[idx], {
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      category: data.category || 'Personal',
      priority: data.priority || 'medium',
      dueDate: data.dueDate || '',
      dueTime: data.dueTime || '',
      sticker: data.sticker !== undefined ? data.sticker : state.tasks[idx].sticker,
      highlighted: !!data.highlighted,
      reminder: !!data.reminder
    });

    saveTasks();
    renderAll();
    playSound('click');
    showToast('Task updated ✨', '✓');
  }

  function toggleHighlight(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    task.highlighted = !task.highlighted;
    saveTasks();
    renderAll();
    playSound('click');
    showToast(task.highlighted ? 'Task Highlighted ⭐' : 'Highlight removed', '⭐');
  }

  function toggleComplete(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;

    if (task.completed) {
      state.profile.completedCount = (state.profile.completedCount || 0) + 1;
      playSound('complete');
      triggerCelebration();
      showToast(`Task completed: "${task.title.slice(0, 20)}..." 🎉`, '✅');
    } else {
      playSound('click');
      showToast('Task restored to active list', '↩');
    }

    saveTasks();
    saveProfile();
    renderAll();
  }

  function deleteTask(id) {
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;

    const removed = state.tasks.splice(idx, 1)[0];
    state.lastDeletedTask = { task: removed, index: idx };

    saveTasks();
    renderAll();
    playSound('click');

    if (state.undoTimeoutId) clearTimeout(state.undoTimeoutId);
    showToast(`Deleted: "${removed.title.slice(0, 18)}..."`, '🗑️', 'Undo', () => {
      if (state.lastDeletedTask && state.lastDeletedTask.task.id === removed.id) {
        state.tasks.splice(state.lastDeletedTask.index, 0, state.lastDeletedTask.task);
        state.lastDeletedTask = null;
        saveTasks();
        renderAll();
        playSound('complete');
        showToast('Task restored ✨', '✓');
      }
    });

    state.undoTimeoutId = setTimeout(() => {
      state.lastDeletedTask = null;
    }, 5000);
  }

  function clearCompletedTasks() {
    const completedCount = state.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear.', '☕');
      return;
    }
    if (confirm(`Clear all ${completedCount} completed tasks?`)) {
      state.tasks = state.tasks.filter(t => !t.completed);
      saveTasks();
      renderAll();
      playSound('click');
      showToast('Completed tasks cleared.', '🧹');
    }
  }

  // Notes CRUD
  function addNote(data) {
    const newNote = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      text: data.text.trim(),
      color: data.color || 'yellow',
      pinned: !!data.pinned,
      createdAt: Date.now()
    };

    state.notes.unshift(newNote);
    saveNotes();
    renderNotes();
    renderStats();
    playSound('click');
    showToast('Note added to Notes column 📝', '📝');
  }

  function updateNote(id, data) {
    const idx = state.notes.findIndex(n => n.id === id);
    if (idx === -1) return;

    state.notes[idx] = Object.assign(state.notes[idx], {
      text: data.text.trim(),
      color: data.color || state.notes[idx].color,
      pinned: !!data.pinned
    });

    saveNotes();
    renderNotes();
    playSound('click');
    showToast('Note updated ✨', '✓');
  }

  function deleteNote(id) {
    state.notes = state.notes.filter(n => n.id !== id);
    saveNotes();
    renderNotes();
    renderStats();
    playSound('click');
  }

  function togglePinNote(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;
    note.pinned = !note.pinned;
    saveNotes();
    renderNotes();
    playSound('click');
  }

  // -------------------------------------------------------------------------
  // 11. INITIAL ONBOARDING PROFILE LOGIC
  // -------------------------------------------------------------------------
  const onboardingModal = document.getElementById('onboarding-modal');
  const onboardingForm = document.getElementById('onboarding-form');
  const onboardingNameInput = document.getElementById('onboarding-name-input');
  const onboardingTaglineInput = document.getElementById('onboarding-tagline-input');
  const onboardingAvatarDisplay = document.getElementById('onboarding-avatar-display');

  let selectedOnboardingAvatar = '😊';

  const onboardingAvBtns = document.querySelectorAll('#onboarding-avatar-selector .av-btn');
  onboardingAvBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      onboardingAvBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedOnboardingAvatar = btn.dataset.avatar;
      if (onboardingAvatarDisplay) onboardingAvatarDisplay.textContent = selectedOnboardingAvatar;
    });
  });

  function checkInitialOnboarding() {
    // Ask for the profile each time the app starts.
    if (onboardingModal) {
      onboardingModal.style.display = 'flex';
      setTimeout(() => {
        if (onboardingNameInput) onboardingNameInput.focus();
      }, 100);
    }
  }

  if (onboardingForm) {
    onboardingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = onboardingNameInput.value.trim();
      if (!name) return;

      state.profile.name = name;
      state.profile.tagline = onboardingTaglineInput.value.trim() || 'Taking it one peaceful step at a time ✨';
      state.profile.avatar = selectedOnboardingAvatar;

      localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
      saveProfile();
      renderAll();

      if (onboardingModal) onboardingModal.style.display = 'none';
      playSound('complete');
      showToast(`Welcome, ${name}! Your profile is ready ✨`, selectedOnboardingAvatar);
    });
  }

  // -------------------------------------------------------------------------
  // 12. MODALS (TASK, NOTE, PROFILE)
  // -------------------------------------------------------------------------
  const taskModal = document.getElementById('task-modal');
  const taskForm = document.getElementById('task-form');
  const taskEditIdInput = document.getElementById('task-edit-id');
  const taskTitleInput = document.getElementById('task-title-input');
  const taskDescInput = document.getElementById('task-desc-input');
  const taskCategorySelect = document.getElementById('task-category-select');
  const taskDueDateInput = document.getElementById('task-due-date');
  const taskDueTimeInput = document.getElementById('task-due-time');
  const taskHighlightToggle = document.getElementById('task-highlight-toggle');
  const taskReminderToggle = document.getElementById('task-reminder-toggle');
  const taskModalTitle = document.getElementById('task-modal-title');
  const closeTaskModalBtn = document.getElementById('close-task-modal-btn');
  const cancelTaskModalBtn = document.getElementById('cancel-task-modal-btn');
  const openTaskModalBtn = document.getElementById('open-task-modal-btn');

  // Notes Modal
  const noteModal = document.getElementById('note-modal');
  const noteForm = document.getElementById('note-form');
  const noteEditIdInput = document.getElementById('note-edit-id');
  const noteTextInput = document.getElementById('note-text-input');
  const notePinnedToggle = document.getElementById('note-pinned-toggle');
  const noteModalTitle = document.getElementById('note-modal-title');
  const closeNoteModalBtn = document.getElementById('close-note-modal-btn');
  const cancelNoteModalBtn = document.getElementById('cancel-note-modal-btn');
  const openNoteModalBtn = document.getElementById('open-note-modal-btn');

  // Profile Modal
  const profileModal = document.getElementById('profile-modal');
  const profileForm = document.getElementById('profile-form');
  const openProfileBtn = document.getElementById('open-profile-btn');
  const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
  const profileNameInput = document.getElementById('profile-name-input');
  const profileTaglineInput = document.getElementById('profile-tagline-input');
  const profileAvatarDisplay = document.getElementById('profile-avatar-display');
  const resetDataBtn = document.getElementById('reset-data-btn');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');

  let selectedSticker = '';
  let selectedNoteColor = 'yellow';
  let selectedProfileAvatar = '😊';

  // Sticker Selector Buttons
  const stkBtns = document.querySelectorAll('#task-sticker-selector .stk-btn');
  stkBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stkBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSticker = btn.dataset.sticker;
    });
  });

  // Note Color Dots
  const dotBtns = document.querySelectorAll('#note-color-selector .dot-btn');
  dotBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dotBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedNoteColor = btn.dataset.color;
    });
  });

  // Profile Avatar Options
  const avatarOpts = document.querySelectorAll('#avatar-sticker-selector .av-btn');
  avatarOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      avatarOpts.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedProfileAvatar = btn.dataset.avatar;
      if (profileAvatarDisplay) profileAvatarDisplay.textContent = selectedProfileAvatar;
    });
  });

  function openAddTaskModal(prefillTitle = '') {
    taskEditIdInput.value = '';
    taskTitleInput.value = prefillTitle;
    taskDescInput.value = '';
    taskCategorySelect.value = state.activeCategory !== 'all' ? state.activeCategory : 'Personal';
    taskDueDateInput.value = '';
    taskDueTimeInput.value = '';
    taskHighlightToggle.checked = false;
    taskReminderToggle.checked = true;

    const highRadio = document.querySelector('input[name="task-priority"][value="high"]');
    if (highRadio) highRadio.checked = true;

    selectedSticker = '';
    stkBtns.forEach(b => b.classList.toggle('selected', b.dataset.sticker === ''));

    taskModalTitle.textContent = 'New Task';
    taskModal.style.display = 'flex';
    taskTitleInput.focus();
  }

  function openEditTaskModal(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    taskEditIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskCategorySelect.value = task.category || 'Personal';
    taskDueDateInput.value = task.dueDate || '';
    taskDueTimeInput.value = task.dueTime || '';
    taskHighlightToggle.checked = !!task.highlighted;
    taskReminderToggle.checked = !!task.reminder;

    const priorityRadio = document.querySelector(`input[name="task-priority"][value="${task.priority || 'medium'}"]`);
    if (priorityRadio) priorityRadio.checked = true;

    selectedSticker = task.sticker || '';
    stkBtns.forEach(b => b.classList.toggle('selected', b.dataset.sticker === selectedSticker));

    taskModalTitle.textContent = 'Edit Task Details';
    taskModal.style.display = 'flex';
    taskTitleInput.focus();
  }

  function closeTaskModal() {
    taskModal.style.display = 'none';
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    if (!title) return;

    const editId = taskEditIdInput.value;
    const priorityRadio = document.querySelector('input[name="task-priority"]:checked');

    const taskData = {
      title,
      description: taskDescInput.value,
      category: taskCategorySelect.value,
      priority: priorityRadio ? priorityRadio.value : 'medium',
      dueDate: taskDueDateInput.value,
      dueTime: taskDueTimeInput.value,
      sticker: selectedSticker,
      highlighted: taskHighlightToggle.checked,
      reminder: taskReminderToggle.checked
    };

    if (editId) {
      updateTask(editId, taskData);
    } else {
      addTask(taskData);
    }

    closeTaskModal();
  });

  // Note Modal
  function openAddNoteModal() {
    noteEditIdInput.value = '';
    noteTextInput.value = '';
    notePinnedToggle.checked = false;
    selectedNoteColor = 'yellow';
    dotBtns.forEach(b => b.classList.toggle('selected', b.dataset.color === 'yellow'));

    noteModalTitle.textContent = 'New Note';
    noteModal.style.display = 'flex';
    noteTextInput.focus();
  }

  function openEditNoteModal(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;

    noteEditIdInput.value = note.id;
    noteTextInput.value = note.text;
    notePinnedToggle.checked = !!note.pinned;
    selectedNoteColor = note.color || 'yellow';
    dotBtns.forEach(b => b.classList.toggle('selected', b.dataset.color === selectedNoteColor));

    noteModalTitle.textContent = 'Edit Note';
    noteModal.style.display = 'flex';
    noteTextInput.focus();
  }

  function closeNoteModal() {
    noteModal.style.display = 'none';
  }

  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = noteTextInput.value.trim();
    if (!text) return;

    const editId = noteEditIdInput.value;
    const noteData = {
      text,
      color: selectedNoteColor,
      pinned: notePinnedToggle.checked
    };

    if (editId) {
      updateNote(editId, noteData);
    } else {
      addNote(noteData);
    }

    closeNoteModal();
  });

  // Profile Modal
  function openProfileModal() {
    profileNameInput.value = state.profile.name || 'Vrush';
    profileTaglineInput.value = state.profile.tagline || '';
    selectedProfileAvatar = state.profile.avatar || '😊';

    if (profileAvatarDisplay) profileAvatarDisplay.textContent = selectedProfileAvatar;
    avatarOpts.forEach(b => b.classList.toggle('selected', b.dataset.avatar === selectedProfileAvatar));

    profileModal.style.display = 'flex';
    profileNameInput.focus();
  }

  function closeProfileModal() {
    profileModal.style.display = 'none';
  }

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = profileNameInput.value.trim();
    if (!name) return;

    state.profile.name = name;
    state.profile.tagline = profileTaglineInput.value.trim();
    state.profile.avatar = selectedProfileAvatar;

    saveProfile();
    renderAll();
    closeProfileModal();
    playSound('click');
    showToast('Profile updated ✨', selectedProfileAvatar);
  });

  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      if (confirm('Reset your tasks, notes, and profile to initial starter state?')) {
        localStorage.clear();
        state.alertedTaskIds.clear();
        seedInitialTasks();
        seedInitialNotes();
        state.profile = {
          name: '',
          tagline: 'Taking it one peaceful step at a time ✨',
          avatar: '😊',
          streak: 1,
          completedCount: 0
        };
        closeProfileModal();
        renderAll();
        checkInitialOnboarding();
        playSound('complete');
        showToast('All reset to initial defaults.', '✨');
      }
    });
  }

  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
  }

  // -------------------------------------------------------------------------
  // 13. THEME CONTROLLER (3 LIGHT & 3 DARK THEMES)
  // -------------------------------------------------------------------------
  const themeMenuBtn = document.getElementById('theme-menu-btn');
  const themeDropdown = document.getElementById('theme-dropdown');
  const themeOpts = document.querySelectorAll('.theme-opt');

  function applyTheme(themeKey) {
    if (!THEME_NAMES[themeKey]) themeKey = 'light-pure';
    state.theme = themeKey;
    document.documentElement.setAttribute('data-theme', themeKey);
    saveTheme();

    if (currentThemeLabelEl) {
      currentThemeLabelEl.textContent = THEME_NAMES[themeKey];
    }

    themeOpts.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeVal === themeKey);
    });
  }

  if (themeMenuBtn && themeDropdown) {
    themeMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      themeDropdown.classList.remove('show');
    });

    themeOpts.forEach(btn => {
      btn.addEventListener('click', () => {
        const themeVal = btn.dataset.themeVal;
        applyTheme(themeVal);
        themeDropdown.classList.remove('show');
        playSound('click');
        showToast(`Theme: ${THEME_NAMES[themeVal]}`, '🎨');
      });
    });
  }

  // -------------------------------------------------------------------------
  // 14. SOUND TOGGLE
  // -------------------------------------------------------------------------
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIconEl = document.getElementById('sound-icon');

  function updateSoundIcon() {
    if (soundIconEl) {
      soundIconEl.textContent = state.soundEnabled ? '🔔' : '🔕';
    }
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      saveSound();
      updateSoundIcon();
      if (state.soundEnabled) playSound('click');
      showToast(state.soundEnabled ? 'Reminders and chimes ON' : 'Audio muted', state.soundEnabled ? '🔔' : '🔕');
    });
  }

  // -------------------------------------------------------------------------
  // 15. SEARCH BAR
  // -------------------------------------------------------------------------
  const searchInput = document.getElementById('task-search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
      }
      renderTasks();
      renderCompletedTasks();
      renderNotes();
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      state.searchQuery = '';
      if (searchInput) searchInput.value = '';
      searchClearBtn.style.display = 'none';
      renderTasks();
      renderCompletedTasks();
      renderNotes();
    });
  }

  // -------------------------------------------------------------------------
  // 16. FILTERS & SORTING
  // -------------------------------------------------------------------------
  const pillFilters = document.querySelectorAll('.pill-filter');
  pillFilters.forEach(pill => {
    pill.addEventListener('click', () => {
      pillFilters.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeFilter = pill.dataset.filter;
      renderTasks();
    });
  });

  const catBtns = document.querySelectorAll('.cat-filter-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      state.activeCategory = btn.dataset.cat;
      renderTasks();
    });
  });

  // Quick Inline Add Task
  const quickTaskInput = document.getElementById('quick-task-input');
  const quickAddBtn = document.getElementById('quick-add-btn');
  const focusAddTaskBtn = document.getElementById('focus-add-task-btn');

  function handleQuickAdd() {
    if (!quickTaskInput) return;
    const text = quickTaskInput.value.trim();
    if (!text) return;

    addTask({
      title: text,
      category: state.activeCategory !== 'all' ? state.activeCategory : 'Personal',
      priority: 'medium',
      highlighted: false,
      reminder: true
    });
    quickTaskInput.value = '';
  }

  if (quickAddBtn) quickAddBtn.addEventListener('click', handleQuickAdd);
  if (focusAddTaskBtn) focusAddTaskBtn.addEventListener('click', () => openAddTaskModal());
  if (quickTaskInput) {
    quickTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleQuickAdd();
    });
  }

  // -------------------------------------------------------------------------
  // 17. BUTTON EVENTS & KEYBOARD SHORTCUTS
  // -------------------------------------------------------------------------
  if (openTaskModalBtn) openTaskModalBtn.addEventListener('click', () => openAddTaskModal(quickTaskInput ? quickTaskInput.value : ''));
  if (closeTaskModalBtn) closeTaskModalBtn.addEventListener('click', closeTaskModal);
  if (cancelTaskModalBtn) cancelTaskModalBtn.addEventListener('click', closeTaskModal);

  if (openNoteModalBtn) openNoteModalBtn.addEventListener('click', openAddNoteModal);
  if (closeNoteModalBtn) closeNoteModalBtn.addEventListener('click', closeNoteModal);
  if (cancelNoteModalBtn) cancelNoteModalBtn.addEventListener('click', closeNoteModal);

  if (openProfileBtn) openProfileBtn.addEventListener('click', openProfileModal);
  if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', closeProfileModal);

  // Close modals on backdrop click
  [taskModal, noteModal, profileModal].forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) m.style.display = 'none';
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeNoteModal();
      closeProfileModal();
      if (themeDropdown) themeDropdown.classList.remove('show');
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      openAddTaskModal();
    }
  });

  // -------------------------------------------------------------------------
  // 18. INITIALIZATION
  // -------------------------------------------------------------------------
  function init() {
    loadFromStorage();
    applyTheme(state.theme);
    updateSoundIcon();
    renderAll();
    checkInitialOnboarding();

    setInterval(checkReminders, 10000);
    setTimeout(checkReminders, 1500);

    document.addEventListener('click', initAudioContext, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
