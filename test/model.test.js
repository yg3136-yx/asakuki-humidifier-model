const assert = require("node:assert/strict");
const {
  HumidifierModel,
  MIST_MODES,
  DEFAULT_INTENSITY
} = require("../dist/app.js");

function createModel() {
  return new HumidifierModel(() => {});
}

function testMistCycle() {
  const model = createModel();
  const observed = [model.mistMode];
  for (let i = 0; i < MIST_MODES.length - 1; i += 1) {
    model.pressMist();
    observed.push(model.mistMode);
  }
  assert.deepEqual(observed, MIST_MODES);
  model.pressMist();
  assert.equal(model.state, "Idle");
  assert.equal(model.mistMode, "Off");
}

function testIntensityGuardAndReset() {
  const model = createModel();
  model.pressIntensity();
  assert.equal(model.intensity, DEFAULT_INTENSITY);
  model.pressMist();
  model.pressIntensity();
  assert.equal(model.intensity, "Low");
  for (let i = 0; i < 5; i += 1) model.pressMist();
  assert.equal(model.state, "Idle");
  model.pressMist();
  assert.equal(model.intensity, DEFAULT_INTENSITY);
}

function testLightDependency() {
  const model = createModel();
  model.cycleLight();
  assert.equal(model.lightIndex, -1);
  model.pressMist();
  model.cycleLight();
  assert.equal(model.lightIndex, 0);
  model.stopMist("test");
  assert.equal(model.lightIndex, -1);
}

function testTimedExpiry() {
  const model = createModel();
  model.pressMist();
  model.pressMist();
  assert.equal(model.mistMode, "30 min");
  for (let i = 0; i < 30; i += 1) model.tickTimer();
  assert.equal(model.state, "Idle");
  assert.equal(model.mistMode, "Off");
}

function testEmptyTankProtection() {
  const model = createModel();
  model.pressMist();
  model.cycleLight();
  model.emptyTank();
  assert.equal(model.state, "Empty Tank");
  assert.equal(model.mistMode, "Off");
  assert.equal(model.lightIndex, -1);
  model.pressMist();
  assert.equal(model.state, "Empty Tank");
  model.refillTank();
  assert.equal(model.state, "Idle");
  assert.equal(model.mistMode, "Off");
}

[
  testMistCycle,
  testIntensityGuardAndReset,
  testLightDependency,
  testTimedExpiry,
  testEmptyTankProtection
].forEach((test) => test());

console.log("All humidifier model tests passed.");
