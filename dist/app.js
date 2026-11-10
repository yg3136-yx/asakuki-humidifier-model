(function () {
  "use strict";

  const MIST_MODES = ["Off", "Continuous", "30 min", "60 min", "120 min", "180 min"];
  const MODE_MINUTES = { "30 min": 30, "60 min": 60, "120 min": 120, "180 min": 180 };
  const LIGHT_COLORS = [
    { name: "Warm white", value: "#f7dca2" },
    { name: "Amber", value: "#f3a55d" },
    { name: "Rose", value: "#e88b99" },
    { name: "Violet", value: "#ad8bd6" },
    { name: "Blue", value: "#72aee6" },
    { name: "Aqua", value: "#67c5c7" },
    { name: "Green", value: "#8ac28a" }
  ];

  const DEFAULT_INTENSITY = "High";
  const TICK_MS = 250;
  const LONG_PRESS_MS = 650;
  const DOUBLE_TAP_MS = 360;

  class HumidifierModel {
    constructor(onChange) {
      this.onChange = typeof onChange === "function" ? onChange : function () {};
      this.state = "Idle";
      this.waterAvailable = true;
      this.mistMode = "Off";
      this.intensity = DEFAULT_INTENSITY;
      this.lightIndex = -1;
      this.remainingMinutes = null;
      this.timerStartMinutes = null;
    }

    snapshot(message) {
      const light = this.lightIndex >= 0 ? LIGHT_COLORS[this.lightIndex] : null;
      return {
        state: this.state,
        waterAvailable: this.waterAvailable,
        mistMode: this.mistMode,
        intensity: this.intensity,
        light,
        remainingMinutes: this.remainingMinutes,
        timerStartMinutes: this.timerStartMinutes,
        message: message || ""
      };
    }

    emit(message) {
      const data = this.snapshot(message);
      this.onChange(data);
      return data;
    }

    pressMist() {
      if (!this.waterAvailable) {
        return this.emit("MIST ignored — refill the empty tank first.");
      }

      const currentIndex = MIST_MODES.indexOf(this.mistMode);
      const nextMode = MIST_MODES[(currentIndex + 1) % MIST_MODES.length];

      if (nextMode === "Off") {
        return this.stopMist("MIST advanced past 180 min — mist and light turned off.");
      }

      const startingSession = this.state !== "Misting";
      this.state = "Misting";
      this.mistMode = nextMode;

      if (startingSession) {
        this.intensity = DEFAULT_INTENSITY;
        this.lightIndex = -1;
      }

      if (MODE_MINUTES[nextMode]) {
        this.remainingMinutes = MODE_MINUTES[nextMode];
        this.timerStartMinutes = MODE_MINUTES[nextMode];
      } else {
        this.remainingMinutes = null;
        this.timerStartMinutes = null;
      }

      return this.emit(
        startingSession
          ? `New mist session — ${nextMode}, ${DEFAULT_INTENSITY} intensity, light off.`
          : `Mist program changed to ${nextMode}.`
      );
    }

    pressIntensity() {
      if (this.state !== "Misting") {
        return this.emit("HIGH / LOW ignored — mist is not active.");
      }
      this.intensity = this.intensity === "High" ? "Low" : "High";
      return this.emit(`Mist intensity changed to ${this.intensity}.`);
    }

    cycleLight() {
      if (this.state !== "Misting") {
        return this.emit("LIGHT double-tap ignored — mist is not active.");
      }
      this.lightIndex = (this.lightIndex + 1) % LIGHT_COLORS.length;
      return this.emit(`Light changed to ${LIGHT_COLORS[this.lightIndex].name}.`);
    }

    turnLightOff() {
      if (this.state !== "Misting") {
        return this.emit("LIGHT hold ignored — mist is not active.");
      }
      if (this.lightIndex === -1) {
        return this.emit("Light is already off.");
      }
      this.lightIndex = -1;
      return this.emit("Long press — light turned off.");
    }

    tickTimer() {
      if (this.state !== "Misting" || this.remainingMinutes === null) return null;
      this.remainingMinutes -= 1;
      if (this.remainingMinutes <= 0) {
        return this.stopMist("Timer expired — mist and light turned off.");
      }
      return this.emit("");
    }

    emptyTank() {
      this.waterAvailable = false;
      this.state = "Empty Tank";
      this.mistMode = "Off";
      this.remainingMinutes = null;
      this.timerStartMinutes = null;
      this.lightIndex = -1;
      return this.emit("Tank empty — automatic safety shutdown activated.");
    }

    refillTank() {
      this.waterAvailable = true;
      this.state = "Idle";
      this.mistMode = "Off";
      this.remainingMinutes = null;
      this.timerStartMinutes = null;
      this.lightIndex = -1;
      this.intensity = DEFAULT_INTENSITY;
      return this.emit("Tank refilled — returned to Idle; press MIST to restart.");
    }

    stopMist(message) {
      this.state = this.waterAvailable ? "Idle" : "Empty Tank";
      this.mistMode = "Off";
      this.remainingMinutes = null;
      this.timerStartMinutes = null;
      this.lightIndex = -1;
      this.intensity = DEFAULT_INTENSITY;
      return this.emit(message || "Mist stopped.");
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { HumidifierModel, MIST_MODES, LIGHT_COLORS, DEFAULT_INTENSITY };
  }

  if (typeof document === "undefined") return;

  const elements = {
    mainState: document.getElementById("main-state"),
    mainStatePill: document.getElementById("main-state-pill"),
    mistMode: document.getElementById("mist-mode"),
    intensity: document.getElementById("intensity"),
    lightMode: document.getElementById("light-mode"),
    timerDisplay: document.getElementById("timer-display"),
    timerProgress: document.getElementById("timer-progress"),
    mistCloud: document.getElementById("mist-cloud"),
    deviceLed: document.getElementById("device-led"),
    lightRing: document.getElementById("light-ring"),
    water: document.getElementById("water"),
    emptyMark: document.getElementById("empty-mark"),
    deviceCaption: document.getElementById("device-caption"),
    mistButton: document.getElementById("mist-button"),
    intensityButton: document.getElementById("intensity-button"),
    lightButton: document.getElementById("light-button"),
    waterButton: document.getElementById("water-button"),
    waterDescription: document.getElementById("water-description"),
    eventLog: document.getElementById("event-log"),
    clearLog: document.getElementById("clear-log")
  };

  let logCounter = 0;
  function addLog(message) {
    if (!message) return;
    const empty = elements.eventLog.querySelector(".empty-log");
    if (empty) empty.remove();
    logCounter += 1;
    const item = document.createElement("li");
    const time = document.createElement("time");
    time.textContent = String(logCounter).padStart(2, "0");
    const text = document.createElement("span");
    text.textContent = message;
    item.append(time, text);
    elements.eventLog.prepend(item);
    while (elements.eventLog.children.length > 7) {
      elements.eventLog.lastElementChild.remove();
    }
  }

  function showEmptyLog() {
    elements.eventLog.innerHTML = '<li class="empty-log">Interact with the controls to trace transitions.</li>';
  }

  function render(data) {
    const misting = data.state === "Misting";
    const empty = data.state === "Empty Tank";

    elements.mainState.textContent = data.state;
    elements.mainStatePill.classList.toggle("is-misting", misting);
    elements.mainStatePill.classList.toggle("is-empty", empty);
    elements.mistMode.textContent = data.mistMode;
    elements.intensity.textContent = `${data.intensity}${misting ? "" : " (default)"}`;
    elements.lightMode.textContent = data.light ? data.light.name : "Off";
    elements.mistCloud.classList.toggle("active", misting);
    elements.deviceLed.classList.toggle("on", misting);
    elements.intensityButton.disabled = !misting;
    elements.lightButton.disabled = !misting;

    if (data.light) {
      elements.lightRing.style.background = data.light.value;
      elements.lightRing.style.boxShadow = `0 0 28px 10px ${data.light.value}`;
    } else {
      elements.lightRing.style.background = "#cac9c0";
      elements.lightRing.style.boxShadow = "0 0 0 transparent";
    }

    elements.water.style.height = data.waterAvailable ? "54%" : "0%";
    elements.water.style.opacity = data.waterAvailable ? "1" : "0";
    elements.emptyMark.style.display = empty ? "grid" : "none";
    elements.waterDescription.textContent = data.waterAvailable
      ? "Water is available."
      : "Tank is empty. Mist is locked out until refill.";
    elements.waterButton.textContent = data.waterAvailable ? "Simulate empty tank" : "Refill tank";
    elements.waterButton.classList.toggle("danger", data.waterAvailable);
    elements.waterButton.classList.toggle("refill", !data.waterAvailable);

    if (data.remainingMinutes !== null) {
      elements.timerDisplay.textContent = `${data.remainingMinutes} simulated min`;
      const progress = data.timerStartMinutes
        ? (data.remainingMinutes / data.timerStartMinutes) * 100
        : 0;
      elements.timerProgress.style.width = `${Math.max(0, progress)}%`;
    } else {
      elements.timerDisplay.textContent = data.mistMode === "Continuous" ? "No limit" : "—";
      elements.timerProgress.style.width = "0%";
    }

    if (empty) {
      elements.deviceCaption.textContent = "Safety shutdown: refill required.";
    } else if (misting) {
      elements.deviceCaption.textContent = `${data.mistMode} · ${data.intensity} mist${data.light ? ` · ${data.light.name} light` : " · light off"}`;
    } else {
      elements.deviceCaption.textContent = "Ready. Press MIST to begin.";
    }

    addLog(data.message);
  }

  const model = new HumidifierModel(render);
  showEmptyLog();
  render(model.snapshot(""));

  elements.mistButton.addEventListener("click", function () { model.pressMist(); });
  elements.intensityButton.addEventListener("click", function () { model.pressIntensity(); });
  elements.waterButton.addEventListener("click", function () {
    if (model.waterAvailable) model.emptyTank();
    else model.refillTank();
  });
  elements.clearLog.addEventListener("click", showEmptyLog);

  let holdTimer = null;
  let holdTriggered = false;
  let lastTapAt = 0;

  elements.lightButton.addEventListener("pointerdown", function () {
    if (elements.lightButton.disabled) return;
    holdTriggered = false;
    elements.lightButton.classList.add("is-held");
    holdTimer = window.setTimeout(function () {
      holdTriggered = true;
      lastTapAt = 0;
      model.turnLightOff();
    }, LONG_PRESS_MS);
  });

  elements.lightButton.addEventListener("pointerup", function (event) {
    window.clearTimeout(holdTimer);
    elements.lightButton.classList.remove("is-held");
    if (holdTriggered || elements.lightButton.disabled) return;
    const now = event.timeStamp;
    if (now - lastTapAt <= DOUBLE_TAP_MS) {
      lastTapAt = 0;
      model.cycleLight();
    } else {
      lastTapAt = now;
    }
  });

  ["pointercancel", "pointerleave"].forEach(function (eventName) {
    elements.lightButton.addEventListener(eventName, function () {
      window.clearTimeout(holdTimer);
      elements.lightButton.classList.remove("is-held");
    });
  });
  elements.lightButton.addEventListener("contextmenu", function (event) { event.preventDefault(); });

  window.setInterval(function () { model.tickTimer(); }, TICK_MS);
})();
