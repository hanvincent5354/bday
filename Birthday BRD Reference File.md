# Product Specification & Antigravity Implementation Guide
**Project:** Interactive 60th Birthday Celebration Progressive Web App (PWA)  
**Target Platform:** Mobile Safari (iOS) & Mobile Chrome (Android)  
**Status:** Implementation & Verification Phase  

---

## 1. Executive Summary & Objective

The goal is to produce a self-contained, zero-build Progressive Web Application (PWA) delivering an interactive 60th birthday celebration experience. The app will be previewed and verified on `localhost` via automated headless testing before being deployed to a public repository (GitHub Pages).

### Core Flow
1. **Landing & Audio Initialization:** User taps the landing button, which requests microphone permissions and initializes the Web Audio API context.
2. **Opening Animations:** Chibi SVG characters (Penguin, Cat, Dog) pop onto the screen.
3. **Wobble Run:** The characters execute a 1.8-second wobble run around a central chocolate birthday cake and come to rest facing the cake and viewer.
4. **Prompting:** A speech bubble prompts the recipient: *"Happy 60th Birthday! 🎂 Blow the candles and make a wish!"*
5. **Real-time Candle Blowing:** Low-frequency breath sound (<250 Hz) captured by the microphone triggers the extinguishing of the candles (with a manual tap fallback).
6. **Celebration & Reveal:** Confetti triggers, the animals jump and cheer, and a 3D dual-panel birthday card unrolls displaying the recipient's photo on the left and a personal tribute message on the right.

---

## 2. Functional Requirements (FR)

### FR-1: Audio Engine & Blow Detection
- **Permission Lifecycle:** Audio permissions are requested synchronously on the initial user interaction (`#start-btn`).
- **Signal Processing:** 
  - Media stream is routed to a `BiquadFilterNode` configured as a low-pass filter with a cutoff frequency of 250 Hz.
  - Filter output connects to an `AnalyserNode` (`fftSize = 256`).
  - An animation loop checks frequency bins 1 through 7 (sub-250 Hz range where air puffs generate energy).
  - An average magnitude threshold `> 58` triggers the candle blow.
- **Resource Cleanup:** Upon triggering, all active microphone tracks (`MediaStreamTrack`) are stopped immediately to release the hardware and eliminate recording indicators.
- **Manual Fallback:** A clickable element (`#blow-hint`) provides a fallback trigger in noisy environments or when microphone access is denied.

### FR-2: Character & Object Micro-Animations
- **Inline SVG Construction:** Characters are drawn directly in inline SVG to prevent asset network latency.
- **Keyframe Sequence:**
  - `popIn`: Scales elements from 0 to 1.15 and settles to 1 using a spring timing curve (`cubic-bezier(0.175, 0.885, 0.32, 1.275)`).
  - `wobbleRun`: Character-specific CSS variables (`--startX`, `--startY`, `--targetX`, `--targetY`) govern a 1.8-second running animation with rotational oscillation (`-12deg` to `+12deg`).
  - `cheerJump`: Rapid vertical loop (`translateY(-24px) scale(1.1)`) cycling at 0.45s intervals triggered post-extinguish.

### FR-3: Cake & Dynamic Candles
- **Cake Design:** Dual-tier chocolate finish (`#3e2723`, `#5d4037`) with scalloped frosting accents, customized with recipient label and age badge (`60 Years of Joy`).
- **Candle Flames:** CSS-driven flickering candles using dual radial glows. Upon blow event, class `.out` is added to scale flames down to `0.2` and fade opacity to `0`.

### FR-4: Dual-Panel 3D Card Modal
- **Trigger:** Displays automatically 1.2 seconds after candles are extinguished.
- **Perspective:** Card wrapper uses `perspective: 1200px` and transforms from `scale(0.85) rotateY(15deg)` to `scale(1) rotateY(0deg)`.
- **Layout:**
  - **Left Panel:** Framed portrait container with soft drop shadow.
  - **Right Panel:** Milestone headline and customizable wishes.

---

## 3. Localhost Verification Tasks for Antigravity

Antigravity must execute these validation steps locally before repository commit:

1. **Verify Workspace Structure:**
   - Confirm `index.html` and `manifest.json` exist in root.
   - Confirm `manifest.json` contains valid JSON syntax.
2. **Local HTTP Server Launch:**
   - Serve root via static server (e.g., `npx serve -l 8080 .` or `python3 -m http.server 8080`).
3. **Headless Browser Test:**
   - Run `node test-runner.js` to execute automated assertions (page load, button click, animation states, fallback blow trigger, candle state, and modal opening).
4. **Log Results:**
   - Output explicit pass/fail statuses for every stage.

---

## 4. Implementation Source Files

### File: `manifest.json`
```json
{
  "name": "Happy 60th Birthday!",
  "short_name": "BirthdayApp",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#FFF5F7",
  "theme_color": "#FF8DA1",
  "icons": [
    {
      "src": "[https://api.iconify.design/twemoji:birthday-cake.svg](https://api.iconify.design/twemoji:birthday-cake.svg)",
      "sizes": "192x192 512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

### File: `index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Happy 60th Birthday!</title>
  <link rel="manifest" href="manifest.json" />
  <meta name="theme-color" content="#FF8DA1" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

  <!-- Confetti script -->
  <script src="[https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js](https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js)"></script>

  <style>
    :root {
      --bg: #fff0f3;
      --choco: #3e2723;
      --frosting: #5d4037;
      --cream: #fff3e0;
      --gold: #ffb300;
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at center, #ffffff 0%, var(--bg) 100%);
      min-height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    /* Permission / Start Screen */
    #start-screen {
      position: fixed;
      inset: 0;
      background: rgba(255, 240, 243, 0.98);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      text-align: center;
      padding: 24px;
    }
    .start-btn {
      background: linear-gradient(135deg, #ff6b8b, #ff8da1);
      color: white;
      border: none;
      padding: 16px 36px;
      font-size: 1.25rem;
      font-weight: 700;
      border-radius: 999px;
      box-shadow: 0 8px 24px rgba(255, 107, 139, 0.4);
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .start-btn:active { transform: scale(0.96); }

    /* Scene Container */
    #stage {
      position: relative;
      width: 100vw;
      max-width: 440px;
      height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    /* Speech Bubble */
    .speech-bubble {
      position: absolute;
      top: 14%;
      background: white;
      border-radius: 20px;
      padding: 14px 20px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.08);
      font-weight: 600;
      color: #333;
      text-align: center;
      font-size: 1.05rem;
      opacity: 0;
      transform: translateY(10px) scale(0.9);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 10;
      max-width: 80%;
    }
    .speech-bubble::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 10px 10px 0;
      border-style: solid;
      border-color: white transparent;
    }
    .speech-bubble.show {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    /* Cake Elements */
    .cake-container {
      position: relative;
      margin-top: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .cake-layer {
      width: 220px;
      height: 95px;
      background: linear-gradient(180deg, #4e342e 0%, var(--choco) 100%);
      border-radius: 22px 22px 14px 14px;
      position: relative;
      box-shadow: 0 10px 25px rgba(62, 39, 35, 0.35);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-top: 10px solid #5d4037;
    }
    .cake-layer::before {
      content: '';
      position: absolute;
      top: 0;
      width: 100%;
      height: 18px;
      background: radial-gradient(circle at 10px 0, transparent 8px, #3e2723 8px);
      background-size: 20px 20px;
    }
    .cake-text {
      color: #ffd54f;
      font-family: 'Brush Script MT', cursive, sans-serif;
      font-size: 1.35rem;
      letter-spacing: 0.5px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      margin-top: 8px;
    }
    .cake-age {
      font-weight: 900;
      font-size: 0.85rem;
      color: #fff3e0;
      background: rgba(0,0,0,0.25);
      padding: 2px 10px;
      border-radius: 12px;
      margin-top: 4px;
    }

    /* Candles */
    .candles-row {
      display: flex;
      gap: 18px;
      margin-bottom: -4px;
      z-index: 2;
    }
    .candle {
      width: 10px;
      height: 38px;
      background: repeating-linear-gradient(45deg, #fff, #fff 4px, #ff5252 4px, #ff5252 8px);
      border-radius: 3px 3px 0 0;
      position: relative;
    }
    .wick {
      position: absolute;
      top: -6px;
      left: 4px;
      width: 2px;
      height: 6px;
      background: #333;
    }
    .flame {
      position: absolute;
      top: -20px;
      left: -1px;
      width: 12px;
      height: 16px;
      background: #ffa000;
      border-radius: 50% 50% 20% 20% / 60% 60% 40% 40%;
      box-shadow: 0 0 10px #ffb300, 0 0 16px #ff6f00;
      animation: flicker 0.15s infinite alternate ease-in-out;
      transform-origin: bottom center;
      transition: opacity 0.3s, transform 0.3s;
    }
    .flame.out {
      opacity: 0 !important;
      transform: scale(0.2) translateY(-10px);
    }
    @keyframes flicker {
      0% { transform: scale(1) rotate(-2deg); }
      100% { transform: scale(1.1) rotate(3deg); }
    }

    /* Animated Characters */
    .chibi {
      position: absolute;
      width: 64px;
      height: 64px;
      opacity: 0;
      pointer-events: none;
      transition: transform 0.2s ease;
    }

    @keyframes popIn {
      0% { transform: scale(0) translateY(50px); opacity: 0; }
      70% { transform: scale(1.15) translateY(-10px); opacity: 1; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }
    @keyframes wobbleRun {
      0% { transform: translate(var(--startX), var(--startY)) rotate(0deg); }
      25% { transform: translate(calc(var(--startX) * 0.5), calc(var(--startY) * 0.5)) rotate(-12deg); }
      50% { transform: translate(0, 0) rotate(12deg); }
      75% { transform: translate(calc(var(--targetX) * 0.5), calc(var(--targetY) * 0.5)) rotate(-8deg); }
      100% { transform: translate(var(--targetX), var(--targetY)) rotate(0deg); }
    }
    @keyframes cheerJump {
      0%, 100% { transform: translate(var(--targetX), var(--targetY)) scale(1); }
      50% { transform: translate(var(--targetX), calc(var(--targetY) - 24px)) scale(1.1); }
    }

    #penguin {
      --targetX: -105px;
      --targetY: 60px;
      bottom: 38%;
      left: 50%;
    }
    #cat {
      --targetX: -32px;
      --targetY: 92px;
      bottom: 38%;
      left: 50%;
    }
    #dog {
      --targetX: 42px;
      --targetY: 60px;
      bottom: 38%;
      left: 50%;
    }

    .cheering {
      animation: cheerJump 0.45s infinite ease-in-out !important;
    }

    /* 3D Greeting Card */
    #card-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.5s ease;
      z-index: 200;
      perspective: 1200px;
      padding: 16px;
    }
    #card-modal.open {
      opacity: 1;
      pointer-events: auto;
    }

    .card-book {
      position: relative;
      width: 100%;
      max-width: 360px;
      height: 480px;
      display: flex;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      border-radius: 16px;
      overflow: hidden;
      background: #ffffff;
      transform: scale(0.85) rotateY(15deg);
      transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    #card-modal.open .card-book {
      transform: scale(1) rotateY(0deg);
    }

    .card-half {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .card-left {
      background: #faf7f5;
      border-right: 1px dashed #e0d5ce;
    }
    .card-left img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      border: 4px solid white;
    }
    .card-right {
      background: #ffffff;
      text-align: left;
    }
    .card-right h2 {
      color: #d81b60;
      font-size: 1.3rem;
      margin: 0 0 10px 0;
    }
    .card-right p {
      color: #555;
      font-size: 0.9rem;
      line-height: 1.45;
      margin: 0;
    }

    #blow-hint {
      margin-top: 24px;
      font-size: 0.85rem;
      color: #888;
      cursor: pointer;
      text-decoration: underline;
    }
  </style>
</head>
<body>

  <div id="start-screen">
    <h1 style="color: #d81b60; margin-bottom: 8px;">A Special Surprise!</h1>
    <p style="color: #666; max-width: 260px; margin-bottom: 24px;">
      Tap start to open the celebration (please allow microphone access so you can blow out the candles).
    </p>
    <button class="start-btn" id="start-btn">Start Celebration 🎉</button>
  </div>

  <div id="stage">
    <div class="speech-bubble" id="bubble">
      Happy 60th Birthday! 🎂<br/>Blow the candles and make a wish!
    </div>

    <div class="cake-container">
      <div class="candles-row">
        <div class="candle"><div class="wick"></div><div class="flame" id="flame-1"></div></div>
        <div class="candle"><div class="wick"></div><div class="flame" id="flame-2"></div></div>
        <div class="candle"><div class="wick"></div><div class="flame" id="flame-3"></div></div>
      </div>
      <div class="cake-layer">
        <div class="cake-text">Happy Birthday Mom</div>
        <div class="cake-age">60 Years of Joy</div>
      </div>
    </div>

    <!-- Chibi Penguin -->
    <div id="penguin" class="chibi">
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <ellipse cx="50" cy="55" rx="30" ry="36" fill="#2d3436"/>
        <ellipse cx="50" cy="58" rx="22" ry="28" fill="#ffffff"/>
        <ellipse cx="42" cy="40" rx="4" ry="5" fill="#2d3436"/>
        <ellipse cx="58" cy="40" rx="4" ry="5" fill="#2d3436"/>
        <circle cx="43" cy="38" r="1.5" fill="#fff"/>
        <circle cx="59" cy="38" r="1.5" fill="#fff"/>
        <polygon points="46,46 54,46 50,54" fill="#ff7675"/>
        <ellipse cx="38" cy="91" rx="8" ry="4" fill="#ff7675"/>
        <ellipse cx="62" cy="91" rx="8" ry="4" fill="#ff7675"/>
      </svg>
    </div>

    <!-- Chibi Cat -->
    <div id="cat" class="chibi">
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <polygon points="26,30 38,10 50,30" fill="#f8a5c2"/>
        <polygon points="50,30 62,10 74,30" fill="#f8a5c2"/>
        <ellipse cx="50" cy="56" rx="32" ry="30" fill="#f7d794"/>
        <ellipse cx="50" cy="62" rx="20" ry="18" fill="#ffffff"/>
        <circle cx="40" cy="48" r="4.5" fill="#303952"/>
        <circle cx="60" cy="48" r="4.5" fill="#303952"/>
        <circle cx="41" cy="46" r="1.5" fill="#fff"/>
        <circle cx="61" cy="46" r="1.5" fill="#fff"/>
        <polygon points="48,54 52,54 50,57" fill="#f8a5c2"/>
        <circle cx="34" cy="55" r="4" fill="#ff7675" opacity="0.4"/>
        <circle cx="66" cy="55" r="4" fill="#ff7675" opacity="0.4"/>
      </svg>
    </div>

    <!-- Chibi Dog -->
    <div id="dog" class="chibi">
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <ellipse cx="22" cy="46" rx="10" ry="20" fill="#b08d57" transform="rotate(15 22 46)"/>
        <ellipse cx="78" cy="46" rx="10" ry="20" fill="#b08d57" transform="rotate(-15 78 46)"/>
        <ellipse cx="50" cy="52" rx="30" ry="28" fill="#dfb15b"/>
        <ellipse cx="50" cy="60" rx="18" ry="16" fill="#ffffff"/>
        <circle cx="41" cy="46" r="4" fill="#2d3436"/>
        <circle cx="59" cy="46" r="4" fill="#2d3436"/>
        <circle cx="42" cy="44" r="1.5" fill="#fff"/>
        <circle cx="60" cy="44" r="1.5" fill="#fff"/>
        <ellipse cx="50" cy="52" rx="5" ry="3.5" fill="#2d3436"/>
        <path d="M48,64 Q50,71 52,64" stroke="#ff7675" stroke-width="5" fill="none" stroke-linecap="round"/>
      </svg>
    </div>

    <div id="blow-hint" onclick="blowCandles()">Tap here if mic is quiet / manual blow</div>
  </div>

  <div id="card-modal">
    <div class="card-book">
      <div class="card-half card-left">
        <img src="[https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80](https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80)" alt="Special Photo" />
      </div>
      <div class="card-half card-right">
        <h2>Happy 60th! ✨</h2>
        <p>
          Wishing you a diamond milestone filled with endless health, bright laughter, warmth, and all the love in the world.<br/><br/>
          Thank you for every moment, wisdom, and smile. Here is to your best chapter yet!
        </p>
      </div>
    </div>
  </div>

  <script>
    let audioContext;
    let analyser;
    let micStream;
    let isBlown = false;

    const startBtn = document.getElementById('start-btn');
    const startScreen = document.getElementById('start-screen');
    const bubble = document.getElementById('bubble');
    const flames = [document.getElementById('flame-1'), document.getElementById('flame-2'), document.getElementById('flame-3')];
    const cardModal = document.getElementById('card-modal');
    const animals = [document.getElementById('penguin'), document.getElementById('cat'), document.getElementById('dog')];

    startBtn.addEventListener('click', async () => {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(micStream);
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 250;

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(filter);
        filter.connect(analyser);

        listenForBlow();
      } catch (err) {
        console.warn('Microphone access bypassed or denied; tap fallback available.', err);
      }

      startScreen.style.display = 'none';
      runOpeningSequence();
    });

    function runOpeningSequence() {
      animals.forEach((animal, index) => {
        animal.style.opacity = '1';
        animal.style.animation = `popIn 0.4s ${index * 0.1}s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`;
      });

      setTimeout(() => {
        document.getElementById('penguin').style.setProperty('--startX', '-140px');
        document.getElementById('penguin').style.setProperty('--startY', '-80px');
        document.getElementById('penguin').style.animation = `wobbleRun 1.8s ease-in-out forwards`;

        document.getElementById('cat').style.setProperty('--startX', '0px');
        document.getElementById('cat').style.setProperty('--startY', '-120px');
        document.getElementById('cat').style.animation = `wobbleRun 1.8s ease-in-out forwards`;

        document.getElementById('dog').style.setProperty('--startX', '140px');
        document.getElementById('dog').style.setProperty('--startY', '-80px');
        document.getElementById('dog').style.animation = `wobbleRun 1.8s ease-in-out forwards`;
      }, 500);

      setTimeout(() => {
        bubble.classList.add('show');
      }, 2400);
    }

    function listenForBlow() {
      if (isBlown || !analyser) return;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 1; i < 8; i++) {
        sum += dataArray[i];
      }
      let avg = sum / 7;

      if (avg > 58) {
        blowCandles();
        return;
      }
      requestAnimationFrame(listenForBlow);
    }

    function blowCandles() {
      if (isBlown) return;
      isBlown = true;

      if (micStream) micStream.getTracks().forEach(t => t.stop());

      flames.forEach(f => f.classList.add('out'));
      bubble.classList.remove('show');

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 }
      });

      animals.forEach(el => el.classList.add('cheering'));

      setTimeout(() => {
        cardModal.classList.add('open');
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.4 }
        });
      }, 1200);
    }
  </script>
</body>
</html>
```

### File: `test-runner.js`
*(Antigravity automated test harness using Playwright)*

```javascript
import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Executing Antigravity Localhost Verification Suite...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ['microphone'],
  });
  const page = await context.newPage();

  try {
    const response = await page.goto('http://localhost:8080');
    if (!response || response.status() !== 200) {
      throw new Error(`Local server unreachable: status ${response ? response.status() : 'NO_RESPONSE'}`);
    }
    console.log('✅ Server running on http://localhost:8080 (Status: 200)');

    await page.waitForSelector('#start-screen', { state: 'visible' });
    console.log('✅ Initial landing screen rendered');

    await page.click('#start-btn');
    await page.waitForSelector('#start-screen', { state: 'hidden' });
    console.log('✅ Audio permission trigger accepted & start screen dismissed');

    await page.waitForSelector('.speech-bubble.show', { timeout: 4000 });
    console.log('✅ Chibi intro & wobble run complete; speech bubble visible');

    await page.click('#blow-hint');
    await page.waitForSelector('#flame-1.out', { timeout: 1000 });
    await page.waitForSelector('#flame-2.out', { timeout: 1000 });
    await page.waitForSelector('#flame-3.out', { timeout: 1000 });
    console.log('✅ Blow event triggered and all 3 candle flames extinguished');

    await page.waitForSelector('#penguin.cheering', { timeout: 1000 });
    await page.waitForSelector('#card-modal.open', { timeout: 2500 });
    console.log('✅ Celebration state active and 3D card modal opened');

    console.log('\n🎉 ALL LOCALHOST VERIFICATIONS PASSED.');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
```