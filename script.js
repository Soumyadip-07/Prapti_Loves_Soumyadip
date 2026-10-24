
/* Prapti birthday website
 * Set DRIVE_FEED_URL to your deployed Apps Script web-app URL.
 * Add your own licensed/owned song at assets/our-song.mp3.
 */

// IMPORTANT: Replace this with your deployed Apps Script URL ending in /exec.
const DRIVE_FEED_URL = "https://script.google.com/macros/s/AKfycbxJ9riMNO_nHlUO2sf55cW2lgZ5ZGc5K-uygFUiidfk-eLFBtWGx3oXUwSscHTlUW3p/exec";

const track = document.getElementById("carouselTrack");
const statusEl = document.getElementById("photoStatus");
const carouselWindow = document.getElementById("carouselWindow");
const pauseBtn = document.getElementById("pauseCarousel");
const song = document.getElementById("birthdaySong");
const musicToggle = document.getElementById("musicToggle");
const musicLabel = document.getElementById("musicLabel");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");

let photos = [];
let activeIndex = 0;
let paused = false;
let autoplayRetryAdded = false;

const demoCards = [
  { demo: true, caption: "A little space for your favourite memories", symbol: "♡" },
  { demo: true, caption: "All our little moments, in one place", symbol: "✦" },
  { demo: true, caption: "Our story, one photo at a time", symbol: "♥" }
];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function driveThumb(id) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`;
}

function renderPhotos(items) {
  photos = items
    .filter(p => p && (p.url || p.id))
    .map(p => ({
      id: p.id || "",
      url: p.url || driveThumb(p.id),
      caption: p.name || p.caption || "A little piece of us"
    }));

  if (!photos.length) {
    track.innerHTML = demoCards.map(p =>
      `<div class="photo-card demo-card">
        <div class="photo-placeholder">${p.symbol}</div>
        <p>${escapeHtml(p.caption)}</p>
      </div>`
    ).join("");

    statusEl.textContent = "No photos found · check the Drive folder setup";
    return;
  }

  // Shuffle photos for this visit and duplicate them for the carousel.
  photos.sort(() => Math.random() - 0.5);
  const all = [...photos, ...photos];

track.innerHTML = all.map((p, i) =>
  `<article class="photo-card"
    data-photo-index="${i % photos.length}"
    tabindex="0"
    role="button"
    aria-label="Open memory ${i + 1}">
    <img
      loading="${i < 4 ? "eager" : "lazy"}"
      src="${escapeHtml(p.url)}"
      alt="A memory of us">
  </article>`
).join("");

  track.style.animationDuration = `${Math.max(24, photos.length * 5)}s`;
  statusEl.textContent =
    `${photos.length} ${photos.length === 1 ? "memory" : "memories"} · shuffled for you`;

  track.querySelectorAll(".photo-card").forEach(card => {
    card.addEventListener("click", () => {
      openLightbox(Number(card.dataset.photoIndex));
    });

    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(Number(card.dataset.photoIndex));
      }
    });

    const img = card.querySelector("img");

    img.addEventListener("error", () => {
      img.style.display = "none";
      card.querySelector("p").textContent =
        "Photo unavailable — check Drive sharing and image URL";
    });
  });
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName =
      "drivePhotosCallback_" + Date.now() + "_" +
      Math.random().toString(36).slice(2);

    const script = document.createElement("script");
    let settled = false;

    const timeoutId = setTimeout(() => {
      finish();
      reject(new Error("Drive request timed out"));
    }, 15000);

    function finish() {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = data => {
      finish();
      resolve(data);
    };

    script.src =
      `${url}${url.includes("?") ? "&" : "?"}` +
      `callback=${callbackName}&_=${Date.now()}`;

    script.onerror = () => {
      finish();
      reject(new Error("Could not load the Apps Script photo feed"));
    };

    document.head.appendChild(script);
  });
}

async function loadDrivePhotos() {
  if (
    !DRIVE_FEED_URL ||
    DRIVE_FEED_URL.includes("PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE") ||
    !DRIVE_FEED_URL.includes("/exec")
  ) {
    renderPhotos([]);
    statusEl.textContent =
      "Demo mode · add your deployed Apps Script /exec URL";
    return;
  }

  statusEl.textContent = "Finding our memories…";

  try {
    const data = await jsonp(DRIVE_FEED_URL);

    if (!data || data.ok !== true || !Array.isArray(data.photos)) {
      throw new Error(
        data && data.error ? data.error : "Invalid photo feed response"
      );
    }

    renderPhotos(data.photos);
  } catch (err) {
    renderPhotos([]);
    statusEl.textContent =
      "Could not load Drive photos · check Apps Script deployment";
    console.error("Drive gallery error:", err);
  }
}

// Lightbox
function openLightbox(index) {
  if (!photos.length) return;

  activeIndex = (index + photos.length) % photos.length;
  const p = photos[activeIndex];

  lightboxImage.src = p.url;
  lightboxImage.alt = "A memory of us";
  lightboxCaption.textContent = "";
  lightbox.hidden = false;

  document.body.classList.add("modal-open");
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.src = "";
  document.body.classList.remove("modal-open");
}

function moveLightbox(delta) {
  if (photos.length) openLightbox(activeIndex + delta);
}

document.getElementById("closeLightbox")
  .addEventListener("click", closeLightbox);

document.getElementById("lightboxPrev")
  .addEventListener("click", () => moveLightbox(-1));

document.getElementById("lightboxNext")
  .addEventListener("click", () => moveLightbox(1));

lightbox.addEventListener("click", e => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", e => {
  if (lightbox.hidden) return;

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") moveLightbox(-1);
  if (e.key === "ArrowRight") moveLightbox(1);
});

// Carousel controls
document.getElementById("prevPhoto").addEventListener("click", () => {
  track.style.animationDirection = "reverse";
  track.style.animationPlayState = "running";
  paused = false;
  track.classList.remove("paused");
  pauseBtn.textContent = "Ⅱ";
  pauseBtn.setAttribute("aria-label", "Pause carousel");
});

document.getElementById("nextPhoto").addEventListener("click", () => {
  track.style.animationDirection = "normal";
  track.style.animationPlayState = "running";
  paused = false;
  track.classList.remove("paused");
  pauseBtn.textContent = "Ⅱ";
  pauseBtn.setAttribute("aria-label", "Pause carousel");
});

pauseBtn.addEventListener("click", () => {
  paused = !paused;
  track.classList.toggle("paused", paused);
  track.style.animationPlayState = paused ? "paused" : "running";
  pauseBtn.textContent = paused ? "▶" : "Ⅱ";
  pauseBtn.setAttribute(
    "aria-label",
    paused ? "Resume carousel" : "Pause carousel"
  );
});

carouselWindow.addEventListener("mouseenter", () => {
  if (!paused) track.style.animationPlayState = "paused";
});

carouselWindow.addEventListener("mouseleave", () => {
  if (!paused) track.style.animationPlayState = "running";
});

carouselWindow.addEventListener("focusin", () => {
  track.style.animationPlayState = "paused";
});

carouselWindow.addEventListener("focusout", () => {
  if (!paused) track.style.animationPlayState = "running";
});

// Music controls
function updateMusicButton(isPlaying) {
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicLabel.textContent = isPlaying ? "Stop music" : "Play music";
}

async function startMusic() {
  if (!song) return false;

  try {
    await song.play();
    updateMusicButton(true);
    return true;
  } catch (error) {
    updateMusicButton(false);
    console.info(
      "Music autoplay was blocked or the audio file could not load.",
      error
    );
    return false;
  }
}

// Browsers may block sound autoplay. Try when the page loads.
window.addEventListener("load", () => {
  startMusic();
});

// If autoplay was blocked, retry after the visitor's first interaction.
function retryMusicAfterInteraction() {
  if (!song || !song.paused || autoplayRetryAdded) return;

  autoplayRetryAdded = true;

  const retry = async () => {
    document.removeEventListener("pointerdown", retry);
    document.removeEventListener("keydown", retry);
    autoplayRetryAdded = false;

    // Do not override an intentional stop.
    if (musicToggle.dataset.userStopped === "true") return;

    await startMusic();
  };

  document.addEventListener("pointerdown", retry, { once: true });
  document.addEventListener("keydown", retry, { once: true });
}

document.addEventListener("DOMContentLoaded", retryMusicAfterInteraction);
window.addEventListener("load", retryMusicAfterInteraction);

// Music button: stop or resume.
musicToggle.addEventListener("click", async () => {
  if (song.paused) {
    musicToggle.dataset.userStopped = "false";
    await startMusic();
  } else {
    musicToggle.dataset.userStopped = "true";
    song.pause();
    updateMusicButton(false);
  }
});

song.addEventListener("play", () => updateMusicButton(true));
song.addEventListener("pause", () => updateMusicButton(false));

song.addEventListener("error", () => {
  updateMusicButton(false);
  console.error(
    "Could not load the song. Check that assets/our-song.mp3 exists."
  );
});

// Letter animation
document.getElementById("revealLetter").addEventListener("click", () => {
  const paper = document.querySelector(".letter-paper");
  paper.classList.remove("slow-read");
  void paper.offsetWidth;
  paper.classList.add("slow-read");
  paper.scrollIntoView({ behavior: "smooth", block: "center" });
});

// Start loading photos.
loadDrivePhotos();
