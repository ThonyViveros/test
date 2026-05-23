/**
 * Update these values for your real salon details.
 */
const SALON = {
  phoneDisplay: "(555) 123-4567",
  phoneE164: "15551234567",
  whatsappE164: "15551234567",
};

// #region agent log
function debugLog(location, message, data, hypothesisId) {
  fetch("http://127.0.0.1:7703/ingest/44657b19-495e-469b-9d91-6000441bf85b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "adeeba" },
    body: JSON.stringify({
      sessionId: "adeeba",
      runId: "verify",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

const form = document.getElementById("booking-form");
const statusEl = document.getElementById("form-status");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.getElementById("site-nav");
const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

const dateInput = form?.querySelector('input[name="date"]');
if (dateInput) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

function formatDisplayDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDisplayTime(timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildBookingMessage(data) {
  const lines = [
    "Hi Danys Hair Salon, I'd like to book an appointment:",
    "",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Service: ${data.service}`,
    `Date: ${formatDisplayDate(data.date)}`,
    `Time: ${formatDisplayTime(data.time)}`,
  ];

  if (data.notes.trim()) {
    lines.push(`Notes: ${data.notes.trim()}`);
  }

  return lines.join("\n");
}

function setStatus(message, type = "", fallbackUrl = "") {
  statusEl.innerHTML = "";
  statusEl.classList.remove("is-error", "is-success");

  const text = document.createElement("span");
  text.textContent = message;
  statusEl.appendChild(text);

  if (fallbackUrl) {
    const link = document.createElement("a");
    link.href = fallbackUrl;
    link.className = "booking-fallback";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent =
      fallbackUrl.startsWith("https://wa.me/") ? "Open WhatsApp manually" : "Open text app manually";
    statusEl.appendChild(document.createElement("br"));
    statusEl.appendChild(link);
  }

  if (type) statusEl.classList.add(`is-${type}`);
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function buildWhatsAppUrl(message) {
  return `https://wa.me/${SALON.whatsappE164}?text=${encodeURIComponent(message)}`;
}

function buildSmsUrl(message) {
  const body = encodeURIComponent(message);
  const separator = isIos() ? "&" : "?";
  return `sms:${SALON.phoneE164}${separator}body=${body}`;
}

function openBookingUrl(url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // #region agent log
  debugLog("script.js:openBookingUrl", "booking url opened", { urlScheme: url.split(":")[0] }, "H1");
  // #endregion
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  setStatus("");

  const formData = new FormData(form);
  const data = {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    service: String(formData.get("service") || "").trim(),
    date: String(formData.get("date") || "").trim(),
    time: String(formData.get("time") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    channel: String(formData.get("channel") || "whatsapp"),
  };

  // #region agent log
  debugLog(
    "script.js:submit",
    "booking submit",
    {
      channel: data.channel,
      hasRequiredFields: Boolean(
        data.name && data.phone && data.service && data.date && data.time
      ),
    },
    "H2"
  );
  // #endregion

  if (!data.name || !data.phone || !data.service || !data.date || !data.time) {
    setStatus("Please fill in all required fields.", "error");
    // #region agent log
    debugLog("script.js:submit", "validation failed", { channel: data.channel }, "H2");
    // #endregion
    return;
  }

  const message = buildBookingMessage(data);

  if (data.channel === "whatsapp") {
    const url = buildWhatsAppUrl(message);
    openBookingUrl(url);
    setStatus(
      "If WhatsApp did not open, use the link below to send your booking.",
      "success",
      url
    );
    // #region agent log
    debugLog("script.js:submit", "whatsapp booking ready", { hasFallback: true }, "H1");
    // #endregion
    return;
  }

  const url = buildSmsUrl(message);
  window.location.href = url;
  setStatus(
    "If your text app did not open, use the link below to send your booking.",
    "success",
    url
  );
  // #region agent log
  debugLog("script.js:submit", "sms booking ready", { isIos: isIos() }, "H3");
  // #endregion
});

const quickBookMessage =
  "Hi Danys Hair Salon, I'd like to book an appointment. What times do you have available?";

document.querySelectorAll("#quick-whatsapp, #mobile-whatsapp").forEach((link) => {
  link.href = buildWhatsAppUrl(quickBookMessage);
});

// #region agent log
debugLog(
  "script.js:init",
  "page initialized",
  {
    hasForm: Boolean(form),
    hasStatusEl: Boolean(statusEl),
    quickLinks: document.querySelectorAll("#quick-whatsapp, #mobile-whatsapp").length,
  },
  "H4"
);
// #endregion
