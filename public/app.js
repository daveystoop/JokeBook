const state = {
  jokeType: "classic",
  ageGroup: "all-ages",
  length: "medium",
  isGenerating: false,
};

const generateBtn = document.getElementById("generateBtn");
const btnText = generateBtn.querySelector(".btn-text");
const btnSpinner = generateBtn.querySelector(".btn-spinner");
const jokeCard = document.getElementById("jokeCard");
const jokeText = document.getElementById("jokeText");
const jokeDecoration = document.querySelector(".joke-decoration");
const copyBtn = document.getElementById("copyBtn");
const anotherBtn = document.getElementById("anotherBtn");
const errorMsg = document.getElementById("errorMsg");
const lengthDisplay = document.getElementById("lengthDisplay");

const EMOJIS_BY_TYPE = {
  pun: ["😏", "🙃", "😜", "🤭"],
  "knock-knock": ["🚪", "👊", "😄", "🪟"],
  "one-liner": ["⚡", "😂", "💥", "🎯"],
  classic: ["😄", "😁", "🤣", "😆"],
  question: ["🤔", "❓", "💡", "😏"],
  "groan-worthy": ["😩", "🙈", "😬", "🫣"],
};

function pickEmoji(type) {
  const pool = EMOJIS_BY_TYPE[type] || EMOJIS_BY_TYPE.classic;
  return pool[Math.floor(Math.random() * pool.length)];
}

// --- Pill groups ---
document.querySelectorAll(".pill-group").forEach((group) => {
  const key = group.id; // "jokeType" or "ageGroup"
  group.addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill || state.isGenerating) return;
    group.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    state[key] = pill.dataset.value;
  });
});

// --- Length dots ---
document.querySelectorAll(".length-dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    if (state.isGenerating) return;
    document.querySelectorAll(".length-dot").forEach((d) => d.classList.remove("active"));
    dot.classList.add("active");
    state.length = dot.dataset.value;
    lengthDisplay.textContent =
      state.length.charAt(0).toUpperCase() + state.length.slice(1);
  });
});

// --- Generate ---
generateBtn.addEventListener("click", generateJoke);
anotherBtn.addEventListener("click", generateJoke);

copyBtn.addEventListener("click", () => {
  const text = jokeText.textContent;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy`;
    }, 1800);
  });
});

async function generateJoke() {
  if (state.isGenerating) return;

  state.isGenerating = true;
  setGenerating(true);
  hideError();
  jokeCard.hidden = true;
  jokeText.textContent = "";
  jokeDecoration.textContent = pickEmoji(state.jokeType);

  try {
    const res = await fetch("/api/joke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jokeType: state.jokeType,
        ageGroup: state.ageGroup,
        length: state.length,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      showError(data.error || "Something went wrong. Please try again.");
      return;
    }

    jokeText.textContent = data.joke;
    jokeCard.hidden = false;
  } catch (err) {
    showError("Something went wrong. Make sure the server is running.");
  } finally {
    state.isGenerating = false;
    setGenerating(false);
  }
}

function setGenerating(on) {
  generateBtn.disabled = on;
  anotherBtn.disabled = on;
  btnText.hidden = on;
  btnSpinner.hidden = !on;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
}

function hideError() {
  errorMsg.hidden = true;
}
