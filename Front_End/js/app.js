// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://127.0.0.1:5000"
    : "https://junoon-ai-backend.onrender.com";

const sessionId = crypto.randomUUID();
let currentMode = "default";

// ══════════════════════════════════════════
// MOOD DEFINITIONS — doodles, particles, icons
// ══════════════════════════════════════════
const MOODS = {
    romantic: {
        key: "default",
        dataAttr: "romantic",
        doodles: ["💖","💕","🌹","💗","💞","✨","🦋","💘","🥀","💐","💝","🌸"],
        subtitles: ["Always here to love", "Your heart companion", "Feel the warmth"],
        welcomeText: 'I\'m currently feeling <strong class="mood-highlight">romantic</strong> 💖',
        particleColor: [244, 63, 94],
        logoIcon: "fa-heart-pulse",
    },
    happy: {
        key: "1",
        dataAttr: "happy",
        doodles: ["⭐","🌟","☀️","🎉","🎈","🌻","🎊","✨","🦄","🌈","🎵","💫"],
        subtitles: ["Spreading sunshine!", "Let's have fun!", "Pure joy mode"],
        welcomeText: 'I\'m currently feeling <strong class="mood-highlight">super happy</strong> 😊',
        particleColor: [234, 179, 8],
        logoIcon: "fa-sun",
    },
    sad: {
        key: "2",
        dataAttr: "sad",
        doodles: ["🌧️","💧","🌊","☁️","🕊️","🌙","🫧","💎","❄️","🌫️","🪻","🐚"],
        subtitles: ["Here to comfort you", "It's okay to feel", "Let it rain"],
        welcomeText: 'I\'m currently feeling <strong class="mood-highlight">melancholic</strong> 😢',
        particleColor: [96, 165, 250],
        logoIcon: "fa-cloud-rain",
    },
};

function getMoodByKey(key) {
    if (key === "1") return MOODS.happy;
    if (key === "2") return MOODS.sad;
    return MOODS.romantic;
}

// ══════════════════════════════════════════
// DOM REFS
// ══════════════════════════════════════════
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message");
const welcomeCard = document.getElementById("welcome-card");
const typingIndicator = document.getElementById("typing-indicator");
const sendButton = document.getElementById("send-btn");
const doodlesLayer = document.getElementById("doodles-layer");
const particleCanvas = document.getElementById("particle-canvas");
const appContainer = document.getElementById("app-container");
const introOverlay = document.getElementById("intro-overlay");
const modeSlider = document.getElementById("mode-slider");
const modeBtns = document.querySelectorAll(".mode-btn");

// ══════════════════════════════════════════
// INTRO ANIMATION — Apple-style
// ══════════════════════════════════════════
function createIntroParticles() {
    const container = document.getElementById("intro-particles");
    for (let i = 0; i < 10; i++) {
        const p = document.createElement("div");
        p.className = "intro-particle";
        const size = Math.random() * 4 + 2;
        p.style.width = size + "px";
        p.style.height = size + "px";
        p.style.left = Math.random() * 100 + "%";
        p.style.top = (Math.random() * 100 + 100) + "%";
        p.style.animationDuration = (Math.random() * 4 + 4) + "s";
        p.style.animationDelay = (Math.random() * 3) + "s";
        container.appendChild(p);
    }
}

function runIntro() {
    createIntroParticles();
    setTimeout(() => {
        introOverlay.classList.add("fade-out");
        appContainer.classList.add("visible");
    }, 3200);
    setTimeout(() => {
        introOverlay.remove();
    }, 4200);
}

// ══════════════════════════════════════════
// FLOATING DOODLES
// ══════════════════════════════════════════
let activeDoodles = [];

function spawnDoodles(mood) {
    // Clear existing doodles
    activeDoodles.forEach(d => d.remove());
    activeDoodles = [];

    const emojis = mood.doodles;
    const count = 8;

    for (let i = 0; i < count; i++) {
        const d = document.createElement("div");
        d.className = "doodle";
        d.textContent = emojis[i % emojis.length];
        d.style.left = (10 + Math.random() * 80) + "%";
        d.style.top = (10 + Math.random() * 80) + "%";
        d.style.fontSize = (Math.random() * 16 + 20) + "px";
        // Simple CSS animation — just gentle drift via translateY
        const dur = (8 + Math.random() * 6).toFixed(1);
        const delay = (Math.random() * 4).toFixed(1);
        d.style.animation = `doodleDrift ${dur}s ease-in-out ${delay}s infinite`;

        doodlesLayer.appendChild(d);
        activeDoodles.push(d);
    }
}

// ══════════════════════════════════════════
// PARTICLE SYSTEM (Canvas)
// ══════════════════════════════════════════
const ctx = particleCanvas.getContext("2d");
let particles = [];
let particleColor = [244, 63, 94];
let animFrameId;

function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}
window.addEventListener("resize", () => {
    resizeCanvas();
    const activeBtn = document.querySelector(".mode-btn.active");
    if (activeBtn) {
        updateSlider(activeBtn);
    }
});
resizeCanvas();

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * particleCanvas.width;
        this.y = Math.random() * particleCanvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.25 + 0.05;
        this.targetOpacity = this.opacity;
        this.pulseSpeed = Math.random() * 0.01 + 0.005;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulsePhase += this.pulseSpeed;
        this.opacity = this.targetOpacity + Math.sin(this.pulsePhase) * 0.08;
        if (this.x < -10 || this.x > particleCanvas.width + 10 ||
            this.y < -10 || this.y > particleCanvas.height + 10) {
            this.reset();
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor[0]}, ${particleColor[1]}, ${particleColor[2]}, ${Math.max(0, this.opacity)})`;
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    animFrameId = requestAnimationFrame(animateParticles);
}

// ══════════════════════════════════════════
// MODE SLIDER PILL POSITIONING
// ══════════════════════════════════════════
function updateSlider(activeBtn) {
    if (!activeBtn || !modeSlider) return;
    modeSlider.style.left = activeBtn.offsetLeft + "px";
    modeSlider.style.width = activeBtn.offsetWidth + "px";
}

// Initialize slider position after fonts load
window.addEventListener("load", () => {
    const activeBtn = document.querySelector(".mode-btn.active");
    updateSlider(activeBtn);
});

// ══════════════════════════════════════════
// MOOD TRANSITION
// ══════════════════════════════════════════
function applyMood(mood) {
    // Flash effect
    const flash = document.createElement("div");
    flash.className = "mood-flash";
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 700);

    // Set data attribute on body
    document.body.setAttribute("data-mood", mood.dataAttr);

    // Update particle color
    particleColor = mood.particleColor;

    // Update doodles
    spawnDoodles(mood);

    // Update subtitle with random choice
    const sub = mood.subtitles[Math.floor(Math.random() * mood.subtitles.length)];
    document.getElementById("brand-subtitle").textContent = sub;

    // Update logo icon
    const logoIcon = document.getElementById("logo-icon");
    logoIcon.className = "fa-solid " + mood.logoIcon + " logo-icon";

    // Update welcome text
    const introEl = document.getElementById("personality-intro");
    if (introEl) introEl.innerHTML = mood.welcomeText;
}

// ══════════════════════════════════════════
// CHANGE MODE
// ══════════════════════════════════════════
function changeMode(modeKey) {
    const mood = getMoodByKey(modeKey);

    // Update active button
    modeBtns.forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-mode") === modeKey) {
            btn.classList.add("active");
            updateSlider(btn);
        }
    });

    // Apply visual mood
    applyMood(mood);

    // Initialize backend session
    initializeSession(modeKey, false);
}

// ══════════════════════════════════════════
// SESSION & CHAT API
// ══════════════════════════════════════════
async function initializeSession(mode, isSilent = false) {
    try {
        const response = await fetch(`${API_URL}/api/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: sessionId,
                mode: mode === "default" ? "" : mode
            })
        });
        if (!response.ok) throw new Error("Failed to initialize session");
        currentMode = mode;

        if (!isSilent) {
            const msgs = chatMessages.querySelectorAll(".msg-wrapper, .system-msg");
            msgs.forEach(el => el.remove());
            welcomeCard.style.display = "block";
            const mood = getMoodByKey(mode);
            addSystemMessage(`Personality changed to ${getMoodName(mode)}`);
        }
    } catch (err) {
        console.error("Initialization error:", err);
        if (!isSilent) {
            addSystemMessage("Error: Could not switch personality mode.");
        }
    }
}

function getMoodName(mode) {
    if (mode === "1") return "Super Happy 😊";
    if (mode === "2") return "Melancholic 😢";
    return "Romantic 💖";
}

function sendSuggestion(text) {
    messageInput.value = text;
    sendMessage();
}

function getTimestamp() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addSystemMessage(text) {
    const div = document.createElement("div");
    div.className = "system-msg";
    div.innerText = text;
    chatMessages.appendChild(div);
    scrollToBottom();
}

function appendMessage(sender, text) {
    if (welcomeCard.style.display !== "none") {
        welcomeCard.style.display = "none";
    }
    const wrapper = document.createElement("div");
    wrapper.className = `msg-wrapper ${sender}`;
    wrapper.innerHTML = `
        <div class="msg-bubble">${text}</div>
        <div class="msg-meta">${sender === "user" ? "You" : "Junoon"} • ${getTimestamp()}</div>
    `;
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function scrollToBottom() {
    const main = document.getElementById("chat-main");
    main.scrollTop = main.scrollHeight;
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    messageInput.value = "";
    messageInput.disabled = true;
    sendButton.disabled = true;

    appendMessage("user", message);

    typingIndicator.classList.remove("hidden");
    scrollToBottom();

    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, prompt: message })
        });
        if (!response.ok) throw new Error("Server error");
        const data = await response.json();
        typingIndicator.classList.add("hidden");
        appendMessage("bot", data.reply);
    } catch (err) {
        console.error("Chat error:", err);
        typingIndicator.classList.add("hidden");
        addSystemMessage("Could not connect to Junoon AI. Check your backend server.");
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// ══════════════════════════════════════════
// MOBILE VIEWPORT KEYBOARD AND SCALING MANAGEMENT
// ══════════════════════════════════════════
function adjustMobileViewport() {
    const appContainer = document.getElementById("app-container");
    if (!appContainer) return;

    function updateHeight() {
        if (window.visualViewport) {
            const height = window.visualViewport.height;
            const offsetTop = window.visualViewport.offsetTop;
            
            // Only apply on mobile/tablet viewports (width <= 1024px)
            if (window.innerWidth <= 1024) {
                appContainer.style.height = `${height}px`;
                appContainer.style.top = `${offsetTop}px`;
                window.scrollTo(0, 0);
            } else {
                appContainer.style.height = "";
                appContainer.style.top = "";
            }
            scrollToBottom();
        }
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", updateHeight);
        window.visualViewport.addEventListener("scroll", updateHeight);
    }
    window.addEventListener("resize", updateHeight);
    
    // Initial update
    updateHeight();
}

// ══════════════════════════════════════════
// BOOT SEQUENCE
// ══════════════════════════════════════════
window.addEventListener("DOMContentLoaded", () => {
    // Run mobile viewport adjustment
    adjustMobileViewport();

    // Run intro animation
    runIntro();

    // Set initial mood
    const initialMood = MOODS.romantic;
    document.body.setAttribute("data-mood", "romantic");
    particleColor = initialMood.particleColor;

    // Init particles
    initParticles();
    animateParticles();

    // Spawn initial doodles
    spawnDoodles(initialMood);

    // Init backend session silently
    initializeSession("default", true);

    // Attach mode button click handlers
    modeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const modeKey = btn.getAttribute("data-mode");
            changeMode(modeKey);
        });
    });
});