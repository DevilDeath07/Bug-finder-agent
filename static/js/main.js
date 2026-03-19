// ──────────────────────────────────────────
// Marked + Highlight setup
// ──────────────────────────────────────────
marked.setOptions({
    highlight: (code, lang) => {
        const l = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language: l }).value;
    },
    langPrefix: 'hljs language-'
});

// ──────────────────────────────────────────
// App State
// ──────────────────────────────────────────
let currentUser = null;
let rawQueriesData = {};

// ──────────────────────────────────────────
// Screen routing
// ──────────────────────────────────────────
function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Sidebar toggle for mobile
function toggleSidebar(sidebarId) {
    const sidebar = document.getElementById(sidebarId);
    const overlayId = sidebarId === 'app-sidebar' ? 'app-sidebar-overlay' : 'admin-sidebar-overlay';
    const overlay = document.getElementById(overlayId);
    
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    }
}

// ──────────────────────────────────────────
// Auth tab switching
// ──────────────────────────────────────────
function switchAuthTab(tab) {
    // pill tabs
    document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    // slide the pill slider
    const slider = document.getElementById('pill-slider');
    if (slider) slider.style.transform = tab === 'register' ? 'translateX(100%)' : 'translateX(0)';
    document.getElementById('login-form').style.display    = tab === 'login'    ? 'flex' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'flex' : 'none';
    clearAuthMessages();
}

function clearAuthMessages() {
    const errEl = document.getElementById('auth-error');
    const sucEl = document.getElementById('auth-success');
    if (errEl) errEl.style.display = 'none';
    if (sucEl) sucEl.style.display = 'none';
}

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    const tx = document.getElementById('auth-error-text');
    if (!el || !tx) return;
    tx.innerText = msg;
    el.style.display = 'flex';
}

function showAuthSuccess(msg) {
    const el = document.getElementById('auth-success');
    const tx = document.getElementById('auth-success-text');
    if (!el || !tx) return;
    tx.innerText = msg;
    el.style.display = 'flex';
}

function setAuthLoading(btnId, spinnerId, loading) {
    const btn = document.getElementById(btnId);
    const spin = document.getElementById(spinnerId);
    const text = btn ? btn.querySelector('.auth-btn-text') : null;
    if (loading) {
        if (btn) btn.disabled = true;
        if (spin) spin.style.display = 'flex';
        if (text) text.style.opacity = '0.5';
    } else {
        if (btn) btn.disabled = false;
        if (spin) spin.style.display = 'none';
        if (text) text.style.opacity = '1';
    }
}

// Password visibility toggle
function togglePw(inputId, btn) {
    const inp = document.getElementById(inputId);
    const eyeShow = btn.querySelector('.eye-show');
    const eyeHide = btn.querySelector('.eye-hide');
    if (inp.type === 'password') {
        inp.type = 'text';
        if (eyeShow) eyeShow.style.display = 'none';
        if (eyeHide) eyeHide.style.display = 'block';
    } else {
        inp.type = 'password';
        if (eyeShow) eyeShow.style.display = 'block';
        if (eyeHide) eyeHide.style.display = 'none';
    }
}

// Password strength evaluator
function evalPasswordStrength(pw) {
    const bars  = [document.getElementById('pb1'), document.getElementById('pb2'), document.getElementById('pb3'), document.getElementById('pb4')];
    const label = document.getElementById('pw-label');
    const colors = ['#ef4444','#f97316','#eab308','#22c55e'];
    const labels = ['Too weak','Could be stronger','Almost there','Strong password'];
    let score = 0;
    if (pw.length >= 6)  score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    bars.forEach((b, i) => {
        if (!b) return;
        b.style.background = i < score ? colors[score - 1] : 'rgba(255,255,255,0.08)';
    });
    if (label) label.innerText = pw.length === 0 ? 'Enter a password' : (labels[score - 1] || labels[0]);
}

// Particle canvas animation
(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
    const isMobile = window.innerWidth <= 768;
    const pts = Array.from({ length: isMobile ? 20 : 60 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5
    }));
    function draw() {
        ctx.clearRect(0, 0, W, H);
        pts.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > W) p.vx *= -1;
            if (p.y < 0 || p.y > H) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(160,160,255,0.6)';
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
})();

// ──────────────────────────────────────────
// Firebase Auth Listener
// ──────────────────────────────────────────
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        if (user.email === 'admin@123.com') {
            switchScreen('admin-screen');
            loadAdminData();
        } else {
            switchScreen('app-screen');
            setupUserSidebar(user);
            resetChat();
            loadUserHistory(user.uid);
        }
    } else {
        currentUser = null;
        switchScreen('auth-screen');
    }
});

// ──────────────────────────────────────────
// Login
// ──────────────────────────────────────────
async function login() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    clearAuthMessages();

    if (!email || !password) return showAuthError('Please fill in all fields.');
    setAuthLoading('login-btn', 'login-spinner', true);
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
        setAuthLoading('login-btn', 'login-spinner', false);
        showAuthError(friendlyLoginError(e.code));
    }
}

// ──────────────────────────────────────────
// Register
// ──────────────────────────────────────────
async function register() {
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    clearAuthMessages();

    if (!email || !password) return showAuthError('Please fill in all fields.');
    if (password.length < 6)  return showAuthError('Password must be at least 6 characters.');

    setAuthLoading('register-btn', 'register-spinner', true);
    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        db.ref('users/' + cred.user.uid).set({
            email: email,
            createdAt: Date.now()
        }).catch(err => console.error("Firebase DB error:", err));
        showAuthSuccess('Account created! Logging you in...');
    } catch (e) {
        setAuthLoading('register-btn', 'register-spinner', false);
        showAuthError(friendlyRegisterError(e.code));
    }
}

function friendlyLoginError(code) {
    const map = {
        'auth/user-not-found':            'No account found with this email.',
        'auth/wrong-password':            'Incorrect password.',
        'auth/invalid-email':             'Invalid email address.',
        'auth/invalid-credential':        'Invalid email or password.',
        'auth/invalid-login-credentials': 'Invalid email or password.',
        'auth/too-many-requests':         'Too many failed attempts. Please try again.',
        'auth/network-request-failed':    'Network error. Please check your connection.',
        'auth/user-disabled':             'This account has been disabled.',
        'auth/operation-not-allowed':     'Sign-in is currently disabled.',
        'auth/invalid-api-key':           'Server misconfiguration: Firebase API key missing or invalid.'
    };
    if (!map[code]) console.warn('[Auth] Unhandled login error code:', code);
    return map[code] || `An error occurred during sign in. (${code})`;
}

function friendlyRegisterError(code) {
    const map = {
        'auth/email-already-in-use':      'This email is already registered.',
        'auth/invalid-email':             'Please enter a valid email address.',
        'auth/weak-password':             'Password should be at least 6 characters.',
        'auth/invalid-credential':        'Please enter a valid email address.',
        'auth/network-request-failed':    'Network error. Please check your connection.',
        'auth/operation-not-allowed':     'Registration is currently disabled.',
        'auth/invalid-api-key':           'Server misconfiguration: Firebase API key missing or invalid.'
    };
    if (!map[code]) console.warn('[Auth] Unhandled register error code:', code);
    return map[code] || `An error occurred during registration. (${code})`;
}

// ──────────────────────────────────────────
// Logout
// ──────────────────────────────────────────
function logout() { auth.signOut(); }

// ──────────────────────────────────────────
// Sidebar user info
// ──────────────────────────────────────────
function setupUserSidebar(user) {
    const email = user.email || '';
    document.getElementById('sidebar-user-email').innerText = email;
    const initial = email.charAt(0).toUpperCase();
    document.getElementById('sidebar-avatar-icon').innerText = initial;
}

// ──────────────────────────────────────────
// New chat / reset
// ──────────────────────────────────────────
function newChat() {
    resetChat();
}

function resetChat() {
    const chatBox = document.getElementById('chat-box');
    const welcomeScreen = document.getElementById('welcome-screen');
    chatBox.innerHTML = '';
    chatBox.classList.remove('visible');
    welcomeScreen.style.display = 'flex';
}

// ──────────────────────────────────────────
// Suggestion Chips
// ──────────────────────────────────────────
function useChip(el) {
    document.getElementById('code').value = el.innerText;
    analyzeCode();
}

// ──────────────────────────────────────────
// Textarea auto-resize
// ──────────────────────────────────────────
const textarea = document.getElementById('code');
if (textarea) {
    textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 280) + 'px';
    });
    textarea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            analyzeCode();
        }
    });
}

// ──────────────────────────────────────────
// Analyze Code (main action)
// ──────────────────────────────────────────
async function analyzeCode() {
    if (!currentUser) return;
    const codeInput = document.getElementById('code');
    const code = codeInput.value.trim();
    if (!code) return;

    // Hide welcome, show chat
    document.getElementById('welcome-screen').style.display = 'none';
    const chatBox = document.getElementById('chat-box');
    chatBox.classList.add('visible');

    codeInput.value = '';
    codeInput.style.height = 'auto';

    addMessage(code, 'user');
    const loadingId = addLoading();

    try {
        const res  = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await res.json();
        const ai   = data.result;

        removeLoading(loadingId);
        addMessage(ai, 'ai');

        // Persist to Firebase asynchronously
        if (currentUser.email !== 'admin@123.com') {
            db.ref(`users/${currentUser.uid}/queries`).push({
                email: currentUser.email,
                userCode: code,
                aiResponse: ai,
                timestamp: Date.now()
            }).catch(err => console.error("Firebase DB Push error:", err));

            // Add to sidebar history immediately
            addToSidebarHistory(code, ai);
        }

    } catch (err) {
        removeLoading(loadingId);
        addMessage('⚠️ Could not reach the server. Please try again.', 'ai', 'chat-box');
    }
}

// ──────────────────────────────────────────
// Sidebar history
// ──────────────────────────────────────────
function loadUserHistory(uid) {
    const history = document.getElementById('sidebar-history');
    if (!history) return;
    history.innerHTML = '';
    
    db.ref(`users/${uid}/queries`).once('value', snap => {
        if (!snap.exists()) return;
        snap.forEach(child => { 
            const q = child.val();
            if (q.userCode) {
                addToSidebarHistory(q.userCode, q.aiResponse || 'No response recorded.');
            }
        });
    });
}

function addToSidebarHistory(code, aiResponse) {
    const history = document.getElementById('sidebar-history');
    if (!history) return;
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerText = code.slice(0, 40).replace(/\n/g, ' ') + '...';
    item.onclick = () => {
        document.getElementById('welcome-screen').style.display = 'none';
        const chatBox = document.getElementById('chat-box');
        chatBox.classList.add('visible');
        chatBox.innerHTML = '';
        if (code) addMessage(code, 'user');
        if (aiResponse) addMessage(aiResponse, 'ai');
    };
    history.prepend(item);
}

// ──────────────────────────────────────────
// Message rendering
// ──────────────────────────────────────────
function addMessage(text, sender, containerId = 'chat-box') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const div = document.createElement('div');
    div.className = `message ${sender}`;

    if (sender === 'user') {
        div.innerHTML = `<div class="msg-body">${escapeHtml(text)}</div>`;
    } else {
        const parsed = marked.parse(text);
        div.innerHTML = `
            <div class="msg-avatar ai-avatar-icon">AI</div>
            <div class="msg-body markdown-body">${parsed}</div>
        `;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    // Add copy buttons to code blocks
    if (sender === 'ai') {
        div.querySelectorAll('pre').forEach(pre => {
            const btn = document.createElement('button');
            btn.className = 'code-copy-btn';
            btn.innerText = 'Copy';
            btn.onclick = () => {
                const codeEl = pre.querySelector('code');
                if (codeEl) {
                    navigator.clipboard.writeText(codeEl.innerText).then(() => {
                        btn.innerText = 'Copied ✓';
                        setTimeout(() => btn.innerText = 'Copy', 2000);
                    });
                }
            };
            pre.appendChild(btn);
        });
    }
}

function addLoading(containerId = 'chat-box') {
    const container = document.getElementById(containerId);
    const id = 'ld-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message ai';
    div.innerHTML = `
        <div class="msg-avatar ai-avatar-icon">AI</div>
        <div class="msg-body">
            <div class="loading-dots">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ──────────────────────────────────────────
// ADMIN
// ──────────────────────────────────────────
function showAdminTab(tab, el) {
    document.querySelectorAll('.admin-nav-item').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('admin-tab-' + tab).classList.add('active');
    return false;
}

function loadAdminData() {
    const tbody      = document.getElementById('activity-log');
    const usersTable = document.getElementById('users-table');

    db.ref('users').on('value', snap => {
        const count = snap.numChildren() || 0;
        document.getElementById('total-users').innerText = count;

        if (usersTable) usersTable.innerHTML = '';
        if (tbody) tbody.innerHTML = '';
        
        rawQueriesData = {};
        let totalQ = 0;
        let todayQ = 0;
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);

        snap.forEach(child => {
            const uid = child.key;
            const u = child.val();
            const email = u.email || 'Unknown';
            const initial = email.charAt(0).toUpperCase();

            const userQueries = [];
            if (u.queries) {
                for (let key in u.queries) {
                    userQueries.push(u.queries[key]);
                }
            }
            rawQueriesData[uid] = userQueries;
            
            const qCount = userQueries.length;
            totalQ += qCount;
            
            userQueries.forEach(q => {
                if (q.timestamp && q.timestamp >= todayStart.getTime()) todayQ++;
            });

            if (usersTable) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="user-cell">
                            <div class="user-cell-avatar">${initial}</div>
                        </div>
                    </td>
                    <td>${escapeHtml(email)}</td>
                    <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td><span class="badge badge-blue">${qCount}</span></td>
                `;
                usersTable.appendChild(tr);
            }
            
            if (qCount > 0 && tbody) {
                const latest = userQueries[userQueries.length - 1];
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="user-cell">
                            <div class="user-cell-avatar">${initial}</div>
                            <span>${escapeHtml(email)}</span>
                        </div>
                    </td>
                    <td>${latest.timestamp ? new Date(latest.timestamp).toLocaleString() : '—'}</td>
                    <td><span class="badge badge-blue">${qCount}</span></td>
                    <td><button class="view-btn" onclick="openAdminModal('${uid}', '${escapeHtml(email)}')">View Chat</button></td>
                `;
                tbody.appendChild(tr);
            }
        });

        document.getElementById('total-queries').innerText = totalQ;
        document.getElementById('active-today').innerText  = todayQ;
    });
}

function openAdminModal(uid, email) {
    const modal = document.getElementById('view-modal');
    const msgs  = document.getElementById('modal-messages');
    const title = document.getElementById('modal-title');
    title.innerText = `Chat — ${email}`;
    msgs.innerHTML = '';

    (rawQueriesData[uid] || []).forEach(q => {
        addMessage(q.userCode,   'user', 'modal-messages');
        addMessage(q.aiResponse, 'ai',   'modal-messages');
    });

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('view-modal').classList.remove('active');
}
