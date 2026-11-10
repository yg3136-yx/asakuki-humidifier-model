# ASAKUKI Humidifier Interaction Model

An interactive browser prototype that translates the physical controls of an
ASAKUKI humidifier into a computational model. The project was created for a
Theory and Programming of Interactive Media course activity about moving from
observed appliance behavior to explicit states, variables, transitions, and
constraints.

## Live prototype

[Open the interactive model](https://asakuki-humidifier-model.yixin4356.chatgpt.site)

## Main interactions

### Mist control and accelerated timer

Pressing **MIST** advances through the observed sequence:

`Off → Continuous → 30 min → 60 min → 120 min → 180 min → Off`

Timed modes use an accelerated countdown so that the behavior can be tested
without waiting for real-world timer durations. In this version, one simulated
minute lasts 0.25 seconds.

### Mist intensity

- **HIGH / LOW** works only while the humidifier is actively misting.
- Each new mist session starts at the assumed default intensity, **High**.
- Changing timer modes during the same session does not reset the intensity.

### Light gestures

The prototype uses one **LIGHT** button to represent two physical gestures:

- Double-tap to advance to the next light color.
- Press and hold for 650 milliseconds to turn the light off.

The light depends on the mist state. Stopping mist also turns the light off,
and the LIGHT control is unavailable when mist is inactive.

### Empty-tank protection

- Simulating an empty tank stops mist automatically.
- The timer is cancelled and the light turns off.
- MIST cannot restart until the tank is refilled.
- Refilling returns the model to **Idle**; it does not restart mist automatically.

## Model structure

The main operating state is kept separate from the appliance settings:

- Main states: `Idle`, `Misting`, and `Empty Tank`
- Mist program: `Off`, `Continuous`, `30`, `60`, `120`, or `180 minutes`
- Intensity: `High` or `Low`
- Light: `Off` or a selected color
- Water: available or empty

These values are separated to avoid creating a different main state for every
possible combination. Dependencies are still explicit—for example, leaving the
Misting state always turns the light off.

## First-version assumptions

- High is the default mist intensity.
- A new mist session begins with the light off.
- Selecting a new timed mode restarts its countdown.
- A single LIGHT click has no effect.
- The temporary color sequence is Warm White, Amber, Rose, Violet, Blue, Aqua,
  and Green.
- Water is modeled as either available or empty rather than decreasing gradually.

These choices are displayed inside the prototype so they can be evaluated and
revised after further observation of the physical appliance.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js built-in assertion library for model tests

No JavaScript framework or external runtime dependency is required.

## Project structure

```text
asakuki-humidifier-model/
├── dist/
│   ├── index.html      # Interface structure
│   ├── styles.css      # Responsive appliance visualization and layout
│   └── app.js          # Humidifier model, controls, gestures, and rendering
├── test/
│   └── model.test.js   # State-transition tests
└── README.md
```

## Run locally

Serve the `dist` directory with any static web server. For example:

```bash
python3 -m http.server 4173 --directory dist
```

Then open <http://localhost:4173>.

## Run the model tests

Node.js is only needed for the tests:

```bash
node test/model.test.js
```

The tests cover:

- The complete MIST mode cycle
- The HIGH / LOW guard and default-intensity reset
- The dependency between mist and light
- Accelerated timer expiration
- Empty-tank lockout and refill behavior

## Possible next steps

- Replace the assumed light-color sequence with the exact physical sequence.
- Confirm whether a new mist session automatically turns on a default light.
- Refine double-click and long-press timing through usability testing.
- Add gradual water-level simulation or additional appliance feedback.
