const ROBOFLOW_MODEL_ID = "defect-detecting-ai-2-master";
const ROBOFLOW_VERSION = "1";
const ROBOFLOW_API_KEY = "f99bmWpWfgHFajGmYxs1";

const API_URL = `https://detect.roboflow.com/${ROBOFLOW_MODEL_ID}/${ROBOFLOW_VERSION}?api_key=${ROBOFLOW_API_KEY}`;

const BOX_STROKE = "#ff0000";
const BOX_LINE_WIDTH = 3;
const LABEL_FONT = '600 14px "JetBrains Mono", ui-monospace, monospace';
const LABEL_PADDING_X = 6;
const LABEL_PADDING_Y = 4;
const LABEL_LINE_HEIGHT = 18;

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const cameraInput = document.getElementById("camera-input");
const browseBtn = document.getElementById("browse-btn");
const cameraBtn = document.getElementById("camera-btn");
const previewContainer = document.getElementById("preview-container");
const previewCanvasWrap = document.getElementById("preview-canvas-wrap");
const previewCanvas = document.getElementById("preview-canvas");
const previewPlaceholder = previewContainer.querySelector(".preview-placeholder");
const resultsContainer = document.getElementById("results-container");

let currentImage = null;
let lastPredictions = [];

function predictionToRect(prediction) {
  const width = prediction.width;
  const height = prediction.height;
  return {
    x: prediction.x - width / 2,
    y: prediction.y - height / 2,
    width,
    height,
  };
}

function drawPredictionLabel(ctx, className, boxX, boxY) {
  ctx.font = LABEL_FONT;
  const textWidth = ctx.measureText(className).width;
  const labelWidth = textWidth + LABEL_PADDING_X * 2;
  const labelHeight = LABEL_LINE_HEIGHT;
  let labelY = boxY - labelHeight;

  if (labelY < 0) {
    labelY = boxY;
  }

  ctx.fillStyle = BOX_STROKE;
  ctx.fillRect(boxX, labelY, labelWidth, labelHeight);

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.fillText(className, boxX + LABEL_PADDING_X, labelY + LABEL_PADDING_Y);
}

function drawPredictions(ctx, predictions) {
  ctx.strokeStyle = BOX_STROKE;
  ctx.lineWidth = BOX_LINE_WIDTH;

  for (const prediction of predictions) {
    const { x, y, width, height } = predictionToRect(prediction);
    ctx.strokeRect(x, y, width, height);
    drawPredictionLabel(ctx, prediction.class, x, y);
  }
}

function renderPreview(predictions = lastPredictions) {
  if (!currentImage || !previewCanvas) {
    return;
  }

  lastPredictions = predictions;
  const width = currentImage.naturalWidth;
  const height = currentImage.naturalHeight;

  previewCanvas.width = width;
  previewCanvas.height = height;

  const ctx = previewCanvas.getContext("2d");
  ctx.drawImage(currentImage, 0, 0, width, height);

  if (predictions.length > 0) {
    drawPredictions(ctx, predictions);
  }
}

function showPreviewFromFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const dataUrl = reader.result;
    const img = new Image();

    img.onload = () => {
      currentImage = img;
      lastPredictions = [];
      previewCanvasWrap.classList.remove("hidden");
      if (previewPlaceholder) {
        previewPlaceholder.classList.add("hidden");
      }
      renderPreview([]);
      analyzeImage(dataUrl);
    };

    img.onerror = () => {
      showError();
    };

    img.src = dataUrl;
  };

  reader.onerror = () => {
    showError();
  };

  reader.readAsDataURL(file);
}

function extractBase64(dataUrl) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return dataUrl;
  }
  return dataUrl.slice(commaIndex + 1);
}

function showLoading() {
  resultsContainer.innerHTML = `
    <div class="spinner-wrap">
      <div class="spinner" role="status" aria-label="Loading"></div>
      <p class="spinner-label">Analyzing surface…</p>
    </div>
  `;
}

function showIdle(message) {
  resultsContainer.innerHTML = `<p class="results-idle">${message}</p>`;
}

function showPass() {
  resultsContainer.innerHTML =
    '<p class="result-text result-pass">Result: Non-Defective</p>';
}

function showFail(classes) {
  const unique = [...new Set(classes.filter(Boolean))];
  const list = unique.join(", ");
  resultsContainer.innerHTML = `<p class="result-text result-fail">Result: Defective - ${list}</p>`;
}

function showError() {
  resultsContainer.innerHTML =
    '<p class="result-text result-error">Error analyzing image. Please try again.</p>';
}

async function analyzeImage(dataUrl) {
  showLoading();
  renderPreview([]);

  const base64 = extractBase64(dataUrl);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: base64,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const predictions = Array.isArray(data.predictions) ? data.predictions : [];

    if (predictions.length === 0) {
      showPass();
      renderPreview([]);
      return;
    }

    const classes = predictions.map((item) => item.class);
    showFail(classes);
    renderPreview(predictions);
  } catch {
    showError();
    renderPreview([]);
  }
}

function handleFiles(fileList) {
  const file = fileList && fileList[0];
  if (file) {
    showPreviewFromFile(file);
  }
}

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

browseBtn.addEventListener("click", () => fileInput.click());
cameraBtn.addEventListener("click", () => cameraInput.click());

fileInput.addEventListener("change", (event) => {
  handleFiles(event.target.files);
  fileInput.value = "";
});

cameraInput.addEventListener("change", (event) => {
  handleFiles(event.target.files);
  cameraInput.value = "";
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
  handleFiles(event.dataTransfer.files);
});

window.addEventListener("resize", () => {
  if (currentImage) {
    renderPreview(lastPredictions);
  }
});

const contactToggle = document.getElementById("contact-toggle");
const contactPanel = document.getElementById("contact-panel");

function setContactOpen(open) {
  contactToggle.setAttribute("aria-expanded", String(open));
  contactPanel.hidden = !open;
  contactPanel.classList.toggle("hidden", !open);
}

contactToggle.addEventListener("click", () => {
  const isOpen = contactToggle.getAttribute("aria-expanded") === "true";
  setContactOpen(!isOpen);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && contactToggle.getAttribute("aria-expanded") === "true") {
    setContactOpen(false);
    contactToggle.focus();
  }
});
