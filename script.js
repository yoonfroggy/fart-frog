const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const flyCount = document.querySelector("#flyCount");
const heightLabel = document.querySelector("#heightLabel");
const bestLabel = document.querySelector("#bestLabel");
const leftBtn = document.querySelector("#leftBtn");
const jumpBtn = document.querySelector("#jumpBtn");
const rightBtn = document.querySelector("#rightBtn");
const resetBtn = document.querySelector("#resetBtn");

const W = canvas.width;
const H = canvas.height;
const worldHeight = 2450;
const physicsTimeScale = 3;
const gravity = 0.082;
const friction = 0.84;
const totalFlies = 100;
const maxChargeMs = 2150;

const keys = new Set();
let cameraY = 0;
let bestHeight = Number(localStorage.getItem("frog-hop-best") || 0);
let audioContext = null;
let musicStarted = false;
const sounds = {
  fart: new Audio("assets/fart 2.mp3"),
  dying: new Audio("assets/DYING.mp3"),
  yammy: new Audio("assets/YAMMY.mp3"),
};
let chargeStart = 0;
let isCharging = false;
let message = "A/D or arrows, hold Space to charge";
let messageTimer = 180;
let frame = 0;
let gameWon = false;
let shake = 0;
let aim = 0;
let chargePower = 0;
let sidePower = 0;
let jumpStartY = 0;
let failFall = false;
let lastFrameTime = 0;
const particles = [];

const frog = {
  x: 188,
  y: worldHeight - 92,
  w: 34,
  h: 30,
  vx: 0,
  vy: 0,
  grounded: false,
  facing: 1,
  tongue: null,
};

const start = { x: frog.x, y: frog.y };
jumpStartY = frog.y;

const platforms = [
  { x: 0, y: 2426, w: W, h: 32, kind: "bottom" },
  { x: 36, y: 2388, w: 338, h: 22, kind: "home" },
  { x: 0, y: 2318, w: 72, h: 16, kind: "wall" },
  { x: 252, y: 2274, w: 118, h: 18, kind: "ledge" },
  { x: 64, y: 2216, w: 98, h: 18, kind: "ledge" },
  { x: 348, y: 2170, w: 72, h: 16, kind: "wall" },
  { x: 172, y: 2114, w: 206, h: 18, kind: "rest" },
  { x: 24, y: 2000, w: 126, h: 18, kind: "ledge" },
  { x: 232, y: 1938, w: 82, h: 18, kind: "small" },
  { x: 0, y: 1876, w: 64, h: 16, kind: "wall" },
  { x: 314, y: 1818, w: 72, h: 18, kind: "small" },
  { x: 82, y: 1768, w: 154, h: 18, kind: "ledge" },
  { x: 352, y: 1702, w: 68, h: 16, kind: "wall" },
  { x: 18, y: 1640, w: 78, h: 18, kind: "small" },
  { x: 166, y: 1582, w: 230, h: 18, kind: "rest" },
  { x: 294, y: 1458, w: 92, h: 18, kind: "ledge" },
  { x: 0, y: 1422, w: 70, h: 16, kind: "wall" },
  { x: 132, y: 1396, w: 88, h: 18, kind: "small" },
  { x: 28, y: 1288, w: 112, h: 18, kind: "ledge" },
  { x: 204, y: 1214, w: 122, h: 18, kind: "ledge" },
  { x: 350, y: 1160, w: 70, h: 16, kind: "wall" },
  { x: 78, y: 1110, w: 66, h: 18, kind: "small" },
  { x: 246, y: 1020, w: 150, h: 18, kind: "rest" },
  { x: 0, y: 988, w: 74, h: 16, kind: "wall" },
  { x: 38, y: 922, w: 92, h: 18, kind: "small" },
  { x: 156, y: 840, w: 96, h: 18, kind: "ledge" },
  { x: 292, y: 750, w: 84, h: 18, kind: "small" },
  { x: 356, y: 704, w: 64, h: 16, kind: "wall" },
  { x: 50, y: 672, w: 154, h: 18, kind: "rest" },
  { x: 252, y: 560, w: 122, h: 18, kind: "ledge" },
  { x: 0, y: 522, w: 66, h: 16, kind: "wall" },
  { x: 116, y: 494, w: 70, h: 18, kind: "small" },
  { x: 26, y: 388, w: 94, h: 18, kind: "ledge" },
  { x: 190, y: 312, w: 178, h: 18, kind: "rest" },
  { x: 352, y: 254, w: 68, h: 16, kind: "wall" },
  { x: 100, y: 198, w: 86, h: 18, kind: "small" },
  { x: 228, y: 118, w: 154, h: 22, kind: "crown" },
];

const flies = createFlies();

function createFlies() {
  const seedPoints = [
    [314, 2232],
    [112, 2170],
    [318, 2072],
    [94, 1954],
    [352, 1774],
    [66, 1594],
    [344, 1414],
    [88, 1250],
    [266, 1170],
    [98, 878],
    [318, 520],
    [142, 158],
  ];
  const points = [...seedPoints];
  const flyPlatforms = platforms.filter((platform) => platform.kind !== "bottom");

  for (let i = 0; points.length < totalFlies; i++) {
    const platform = flyPlatforms[i % flyPlatforms.length];
    const slot = Math.floor(i / flyPlatforms.length);
    const wave = ((i * 47) % 100) / 100;
    const margin = Math.min(22, platform.w / 4);
    const x = platform.x + margin + wave * Math.max(8, platform.w - margin * 2);
    const y = platform.y - 34 - (slot % 3) * 24;
    points.push([x, y]);
  }

  return points.slice(0, totalFlies).map(([x, y]) => ({
    x,
    y,
    eaten: false,
    bob: Math.random() * 7,
  }));
}

const scenery = [
  { type: "reed", x: 20, y: 2426 },
  { type: "reed", x: 372, y: 2426 },
  { type: "mushroom", x: 116, y: 2390, color: "#ef8f62" },
  { type: "mushroom", x: 286, y: 2390, color: "#e85a74" },
  { type: "flower", x: 64, y: 2266, color: "#fff08a" },
  { type: "vine", x: 164, y: 2266, length: 76 },
  { type: "flower", x: 350, y: 2146, color: "#f6f5df" },
  { type: "mushroom", x: 92, y: 2014, color: "#8ed0e3" },
  { type: "vine", x: 252, y: 1884, length: 98 },
  { type: "sign", x: 52, y: 1750, text: "hop" },
  { type: "flower", x: 310, y: 1618, color: "#fff08a" },
  { type: "mushroom", x: 124, y: 1484, color: "#ef8f62" },
  { type: "vine", x: 360, y: 1356, length: 88 },
  { type: "flower", x: 82, y: 1224, color: "#f6f5df" },
  { type: "sign", x: 218, y: 1092, text: "rib" },
  { type: "mushroom", x: 312, y: 960, color: "#e85a74" },
  { type: "vine", x: 92, y: 828, length: 110 },
  { type: "flower", x: 312, y: 696, color: "#fff08a" },
  { type: "mushroom", x: 52, y: 564, color: "#8ed0e3" },
  { type: "sign", x: 236, y: 432, text: "sky" },
  { type: "flower", x: 122, y: 292, color: "#f6f5df" },
  { type: "crownGrass", x: 142, y: 116 },
  { type: "crownGrass", x: 260, y: 116 },
];

for (const sound of Object.values(sounds)) {
  sound.preload = "auto";
}

function resetRun() {
  frog.x = start.x;
  frog.y = start.y;
  frog.vx = 0;
  frog.vy = 0;
  frog.tongue = null;
  aim = 0;
  chargePower = 0;
  sidePower = 0;
  jumpStartY = frog.y;
  failFall = false;
  gameWon = false;
  particles.length = 0;
  cameraY = worldHeight - H;
  flies.forEach((fly) => (fly.eaten = false));
  message = "Fresh legs. Eat every fly.";
  messageTimer = 150;
}

function dropToBottom(text = "Missed it. Eat the fall.") {
  frog.x = Math.max(24, Math.min(W - frog.w - 24, frog.x));
  frog.y = worldHeight - 180;
  frog.vx = 0;
  frog.vy = 3.1;
  frog.tongue = null;
  isCharging = false;
  aim = 0;
  chargePower = 0;
  sidePower = 0;
  failFall = true;
  jumpBtn.classList.remove("is-down");
  message = text;
  messageTimer = 150;
  shake = 4;
}

function beginCharge() {
  if (!frog.grounded || isCharging) return;
  isCharging = true;
  chargeStart = performance.now();
  frog.vx = 0;
  jumpBtn.classList.add("is-down");
}

function releaseCharge() {
  if (!isCharging) return;
  const power = chargePower;
  const launchAim = aim;

  const sideCurve = Math.pow(sidePower, 2.25);
  const verticalSpeed = 3.25 + power * 4.05;
  frog.vy = -verticalSpeed;
  frog.vx = launchAim * sideCurve * verticalSpeed * 0.74;
  if (Math.abs(launchAim) > 0.08) frog.facing = Math.sign(launchAim);
  jumpStartY = frog.y;
  failFall = false;
  frog.grounded = false;
  isCharging = false;
  aim = 0;
  chargePower = 0;
  sidePower = 0;
  jumpBtn.classList.remove("is-down");
  shake = Math.max(shake, 1.2 + power * 2.6);
  puff(frog.x + frog.w / 2, frog.y + frog.h, 7, "#d6f0bf");
  playJumpSound(power);
}

function update(dt) {
  frame += dt;
  const direction = inputDirection();

  if (frog.grounded && !isCharging) {
    frog.vx += direction * 0.12 * dt;
    frog.vx = Math.max(-1.25, Math.min(1.25, frog.vx));
    frog.vx *= Math.pow(direction === 0 ? 0.72 : 0.92, dt);
    if (direction !== 0) frog.facing = direction;
  }

  if (isCharging) {
    const held = Math.min(maxChargeMs, performance.now() - chargeStart);
    const ratio = held / maxChargeMs;
    chargePower = 1 - Math.pow(1 - ratio, 1.55);
    if (direction !== 0) {
      sidePower += (1 - sidePower) * (1 - Math.pow(1 - 0.012, dt));
      aim += (direction - aim) * (1 - Math.pow(1 - 0.024, dt));
    } else {
      sidePower *= Math.pow(0.965, dt);
      aim *= Math.pow(0.965, dt);
    }
    if (Math.abs(aim) > 0.08) frog.facing = Math.sign(aim);
    frog.vx *= Math.pow(0.6, dt);
  }

  const previousY = frog.y;
  frog.vy += gravity * dt;
  frog.x += frog.vx * dt;
  frog.y += frog.vy * dt;

  if (!frog.grounded && frog.vy > 0 && frog.y > jumpStartY + 18) {
    failFall = true;
  }

  if (frog.x < -frog.w || frog.x > W) {
    failFall = true;
    frog.x = Math.max(12, Math.min(W - frog.w - 12, frog.x));
    frog.vx = 0;
  }

  frog.grounded = false;
  for (const platform of platforms) {
    if (failFall && platform.kind !== "bottom") continue;

    const lastTop = previousY;
    const top = frog.y;
    const lastBottom = previousY + frog.h;
    const bottom = frog.y + frog.h;
    const withinX = frog.x + frog.w > platform.x && frog.x < platform.x + platform.w;
    const hitHead = lastTop >= platform.y + platform.h && top <= platform.y + platform.h;
    const landed = lastBottom <= platform.y && bottom >= platform.y;

    if (frog.vy < 0 && withinX && hitHead) {
      frog.y = platform.y + platform.h;
      frog.vy = 1.8;
      frog.vx *= 0.55;
      shake = Math.max(shake, 3);
      puff(frog.x + frog.w / 2, frog.y + 2, 5, "#fff8d7");
      message = "bonk.";
      messageTimer = 45;
      continue;
    }

    if (frog.vy >= 0 && withinX && landed) {
      frog.y = platform.y - frog.h;
      frog.vy = 0;
      frog.vx *= Math.pow(friction, dt);
      frog.grounded = true;
      if (platform.kind === "bottom") {
        if (failFall) playSadSound();
        failFall = false;
        jumpStartY = frog.y;
      }
    }
  }

  if (frog.y > worldHeight + 260) {
    dropToBottom("Way down. Land it.");
  }

  for (const fly of flies) {
    if (fly.eaten) continue;
    const dx = frog.x + frog.w / 2 - fly.x;
    const dy = frog.y + frog.h / 2 - (fly.y + Math.sin(frame / 16 + fly.bob) * 6);
    if (Math.hypot(dx, dy) < 28) {
      fly.eaten = true;
      frog.vy -= 3.2;
      frog.tongue = { x: fly.x, y: fly.y, timer: 10 };
      shake = 5;
      burst(fly.x, fly.y, 16, "#f6e765");
      playEatSound();
      message = "slurp!";
      messageTimer = 55;
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.08 * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (frog.tongue) {
    frog.tongue.timer -= dt;
    if (frog.tongue.timer <= 0) frog.tongue = null;
  }

  shake *= Math.pow(0.86, dt);

  const desiredCameraY = Math.max(0, Math.min(worldHeight - H, frog.y - H * 0.58));
  cameraY += (desiredCameraY - cameraY) * (1 - Math.pow(0.9, dt));

  const height = Math.max(0, Math.round((worldHeight - frog.y - 75) / 10));
  if (height > bestHeight) {
    bestHeight = height;
    localStorage.setItem("frog-hop-best", String(bestHeight));
  }

  const eaten = flies.filter((fly) => fly.eaten).length;
  if (!gameWon && eaten === totalFlies && frog.y < 155) {
    gameWon = true;
    burst(frog.x + frog.w / 2, frog.y + 4, 40, "#fff08a");
    message = "Crowned frog. Absolute legend.";
    messageTimer = 300;
  }

  flyCount.textContent = `${eaten} / ${totalFlies}`;
  heightLabel.textContent = `${height} m`;
  bestLabel.textContent = `${bestHeight} m`;
  if (messageTimer > 0) messageTimer -= dt;
}

function inputDirection() {
  const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
  const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D");
  if (left === right) return 0;
  return left ? -1 : 1;
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  startBackgroundMusic(audioContext);
  return audioContext;
}

function playJumpSound(power) {
  getAudioContext();
  playSound(sounds.fart, 0.95);
}

function playEatSound() {
  getAudioContext();
  playSound(sounds.yammy, 0.45);
}

function playSadSound() {
  getAudioContext();
  playSound(sounds.dying, 0.48);
}

function playSound(sound, volume, startAt = 0) {
  sound.pause();
  sound.currentTime = startAt;
  sound.volume = volume;
  sound.play().catch(() => {});
}

function startBackgroundMusic(audio) {
  if (musicStarted) return;
  musicStarted = true;

  const master = audio.createGain();
  master.gain.setValueAtTime(0.035, audio.currentTime);
  master.connect(audio.destination);

  const notes = [98, 123.47, 146.83, 123.47, 87.31, 110, 130.81, 110];
  let step = 0;

  setInterval(() => {
    if (audio.state !== "running") return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(notes[step % notes.length], now);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(520, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(step % 4 === 0 ? 0.42 : 0.24, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.78);
    step++;
  }, 520);
}

function burst(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.1 + Math.random() * 3.4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.8,
      r: 2 + Math.random() * 3,
      color,
      life: 22 + Math.random() * 22,
      maxLife: 44,
    });
  }
}

function puff(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 22,
      y: y + Math.random() * 6,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -0.4 - Math.random() * 1.3,
      r: 4 + Math.random() * 6,
      color,
      life: 18 + Math.random() * 18,
      maxLife: 36,
    });
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#8ed0e3");
  sky.addColorStop(0.55, "#b8deb0");
  sky.addColorStop(1, "#6da56d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255, 246, 190, 0.75)";
  ctx.beginPath();
  ctx.arc(348, 78 - cameraY * 0.04, 34, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 12; i++) {
    const y = (i * 260 - cameraY * 0.35) % (H + 260) - 160;
    const x = 26 + ((i * 83) % 360);
    ctx.fillStyle = i % 2 ? "rgba(59, 109, 76, 0.24)" : "rgba(32, 82, 68, 0.2)";
    ctx.beginPath();
    ctx.ellipse(x, y, 54, 16, -0.22, 0, Math.PI * 2);
    ctx.ellipse(x + 42, y + 8, 42, 13, 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 9; i++) {
    const y = (i * 360 - cameraY * 0.18) % (H + 360) - 220;
    const x = 18 + ((i * 137) % 390);
    ctx.fillStyle = "rgba(20, 55, 47, 0.2)";
    ctx.beginPath();
    ctx.moveTo(x, y + 170);
    ctx.lineTo(x + 52, y + 24);
    ctx.lineTo(x + 104, y + 170);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPlatform(platform) {
  const y = Math.round(platform.y - cameraY);
  if (y > H + 30 || y < -40) return;

  const palette = {
    bottom: ["#355f3d", "#79b85e"],
    home: ["#477b45", "#79b85e"],
    rest: ["#486f51", "#8bc66e"],
    ledge: ["#426d3e", "#79b85e"],
    small: ["#365b42", "#94c86d"],
    wall: ["#314f43", "#84bd74"],
    crown: ["#d7af38", "#fff08a"],
  };
  const [base, highlight] = palette[platform.kind] || palette.ledge;

  ctx.fillStyle = base;
  roundRect(platform.x, y, platform.w, platform.h, 8);
  ctx.fill();

  ctx.fillStyle = highlight;
  roundRect(platform.x + 5, y + 3, platform.w - 10, 5, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(28, 52, 34, 0.28)";
  for (let x = platform.x + 12; x < platform.x + platform.w - 8; x += 24) {
    ctx.beginPath();
    ctx.arc(x, y + platform.h + 1, 3, 0, Math.PI);
    ctx.fill();
  }

  if (platform.kind === "small") {
    ctx.fillStyle = "rgba(255, 248, 215, 0.34)";
    ctx.beginPath();
    ctx.arc(platform.x + platform.w - 16, y + 7, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (platform.kind === "wall") {
    const leftWall = platform.x === 0;
    ctx.fillStyle = "rgba(20, 34, 28, 0.25)";
    for (let i = 0; i < 3; i++) {
      const chipX = leftWall ? platform.x + platform.w - 14 - i * 18 : platform.x + 10 + i * 18;
      ctx.beginPath();
      ctx.arc(chipX, y + 9, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#315b3a";
    ctx.beginPath();
    if (leftWall) {
      ctx.moveTo(platform.x, y);
      ctx.lineTo(platform.x, y - 34);
      ctx.lineTo(platform.x + 18, y);
    } else {
      ctx.moveTo(platform.x + platform.w, y);
      ctx.lineTo(platform.x + platform.w, y - 34);
      ctx.lineTo(platform.x + platform.w - 18, y);
    }
    ctx.fill();
  }

  if (platform.kind === "rest") {
    ctx.fillStyle = "rgba(246, 245, 223, 0.16)";
    roundRect(platform.x + 14, y + 9, platform.w - 28, 4, 3);
    ctx.fill();
  }
}

function drawScenery() {
  for (const item of scenery) {
    const y = item.y - cameraY;
    if (y > H + 140 || y < -180) continue;

    if (item.type === "reed") {
      ctx.strokeStyle = "#315b3a";
      ctx.lineWidth = 4;
      for (let i = 0; i < 5; i++) {
        const x = item.x + i * 8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + (i % 2 ? 8 : -6), y - 42, x + 2, y - 82);
        ctx.stroke();
      }
      ctx.fillStyle = "#a86b4d";
      ctx.beginPath();
      ctx.ellipse(item.x + 18, y - 82, 5, 16, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (item.type === "mushroom") {
      ctx.fillStyle = "#f6f5df";
      roundRect(item.x + 5, y - 18, 10, 18, 4);
      ctx.fill();
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.ellipse(item.x + 10, y - 18, 20, 12, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.beginPath();
      ctx.arc(item.x + 2, y - 22, 3, 0, Math.PI * 2);
      ctx.arc(item.x + 16, y - 18, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (item.type === "flower") {
      ctx.strokeStyle = "#315b3a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(item.x, y);
      ctx.lineTo(item.x, y - 20);
      ctx.stroke();
      ctx.fillStyle = item.color;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        ctx.beginPath();
        ctx.ellipse(item.x + Math.cos(a) * 7, y - 24 + Math.sin(a) * 7, 5, 3, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#f0cd54";
      ctx.beginPath();
      ctx.arc(item.x, y - 24, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (item.type === "vine") {
      ctx.strokeStyle = "#315b3a";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(item.x, y);
      ctx.bezierCurveTo(item.x - 22, y + 28, item.x + 24, y + 58, item.x - 4, y + item.length);
      ctx.stroke();
      ctx.fillStyle = "#6fb65b";
      for (let i = 18; i < item.length; i += 28) {
        ctx.beginPath();
        ctx.ellipse(item.x + (i % 56 === 0 ? 12 : -12), y + i, 10, 5, i, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (item.type === "sign") {
      ctx.strokeStyle = "#5e3f2c";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(item.x + 22, y);
      ctx.lineTo(item.x + 22, y - 42);
      ctx.stroke();
      ctx.fillStyle = "#d6a15d";
      roundRect(item.x, y - 62, 48, 24, 4);
      ctx.fill();
      ctx.fillStyle = "#3a271f";
      ctx.font = "700 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.text, item.x + 24, y - 46);
    }

    if (item.type === "crownGrass") {
      ctx.fillStyle = "#79b85e";
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(item.x + i * 5, y);
        ctx.lineTo(item.x + i * 5 + 3, y - 18 - (i % 3) * 5);
        ctx.lineTo(item.x + i * 5 + 7, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    const y = p.y - cameraY;
    if (y > H + 30 || y < -30) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFly(fly) {
  if (fly.eaten) return;
  const y = fly.y - cameraY + Math.sin(frame / 16 + fly.bob) * 6;
  if (y > H + 40 || y < -40) return;

  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  ctx.beginPath();
  ctx.ellipse(fly.x - 7, y - 4, 9, 6, -0.5, 0, Math.PI * 2);
  ctx.ellipse(fly.x + 7, y - 4, 9, 6, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#211f20";
  ctx.beginPath();
  ctx.arc(fly.x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f6e765";
  ctx.beginPath();
  ctx.arc(fly.x - 2, y - 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrog() {
  const x = Math.round(frog.x);
  const y = Math.round(frog.y - cameraY);
  const chargeRatio = isCharging ? Math.min(1, (performance.now() - chargeStart) / maxChargeMs) : 0;
  const squash = frog.grounded ? Math.min(7, Math.abs(frog.vx) * 0.6 + chargeRatio * 7) : 0;

  if (frog.tongue) {
    ctx.strokeStyle = "#e85a74";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 17, y + 19);
    ctx.lineTo(frog.tongue.x, frog.tongue.y - cameraY);
    ctx.stroke();
  }

  ctx.fillStyle = "#264d2c";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 28, 10, 5, -0.35, 0, Math.PI * 2);
  ctx.ellipse(x + 27, y + 28, 10, 5, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#54b948";
  ctx.beginPath();
  ctx.ellipse(x + 17, y + 17 + squash, 19, 15 - squash * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#77d765";
  ctx.beginPath();
  ctx.arc(x + 8, y + 8, 8, 0, Math.PI * 2);
  ctx.arc(x + 25, y + 8, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f6f2db";
  ctx.beginPath();
  ctx.arc(x + 8, y + 7, 4, 0, Math.PI * 2);
  ctx.arc(x + 25, y + 7, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1c2420";
  ctx.beginPath();
  ctx.arc(x + 8 + frog.facing, y + 7, 2, 0, Math.PI * 2);
  ctx.arc(x + 25 + frog.facing, y + 7, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1f3b23";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 17, y + 17, 8, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawCharge() {
  if (!isCharging) return;
  const ratio = chargePower;
  const sideways = Math.abs(aim) * Math.pow(sidePower, 2.25);
  const x = 78;
  const y = H - 34;

  ctx.fillStyle = "rgba(18, 31, 25, 0.68)";
  roundRect(x, y, W - 156, 16, 8);
  ctx.fill();
  ctx.fillStyle = ratio < 0.55 ? "#f0cd54" : ratio < 0.88 ? "#ef8f62" : "#e85a74";
  roundRect(x + 3, y + 3, (W - 162) * ratio, 10, 6);
  ctx.fill();

  const baseX = frog.x + frog.w / 2;
  const baseY = frog.y - cameraY + frog.h / 2;
  ctx.fillStyle = "rgba(255, 248, 215, 0.82)";
  for (let i = 1; i <= 4; i++) {
    const t = i / 4;
    const curveT = Math.pow(t, 1.45);
    const px = baseX + aim * Math.pow(sidePower, 2.25) * (16 + ratio * 86) * curveT;
    const py = baseY - (26 + ratio * 72) * t + t * t * (12 + sideways * 10);
    ctx.beginPath();
    ctx.arc(px, py, 3.8 - t * 1.4 + sideways * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  if (sideways > 0.05) {
    const meterW = 74;
    const meterX = baseX - meterW / 2;
    const meterY = baseY + 28;
    ctx.fillStyle = "rgba(18, 31, 25, 0.55)";
    roundRect(meterX, meterY, meterW, 8, 4);
    ctx.fill();
    ctx.fillStyle = "#8ed0e3";
    const fill = (meterW / 2 - 3) * sideways;
    const fillX = aim < 0 ? meterX + meterW / 2 - fill : meterX + meterW / 2;
    roundRect(fillX, meterY + 2, fill, 4, 3);
    ctx.fill();
  }
}

function drawMessage() {
  if (messageTimer <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, messageTimer / 25);
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(15, 28, 23, 0.7)";
  roundRect(32, 18, W - 64, 40, 8);
  ctx.fill();
  ctx.fillStyle = "#fff8d7";
  ctx.fillText(message, W / 2, 44);
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function render() {
  ctx.save();
  if (shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }
  drawBackground();
  drawScenery();
  platforms.forEach(drawPlatform);
  flies.forEach(drawFly);
  drawParticles();
  drawFrog();
  drawCharge();
  drawMessage();
  ctx.restore();
}

function loop(timestamp = 0) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const elapsedMs = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  const dt = Math.min(6, Math.max(0, elapsedMs / (1000 / 60))) * physicsTimeScale;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  keys.add(event.code === "Space" ? "Space" : event.key);
  if (event.code === "Space") beginCharge();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code === "Space" ? "Space" : event.key);
  if (event.code === "Space") releaseCharge();
});

function bindHoldButton(button, key, onDown, onUp) {
  const activePointers = new Set();

  const down = (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    activePointers.add(event.pointerId);
    keys.add(key);
    button.classList.add("is-down");
    onDown?.();
  };

  const up = (event) => {
    event.preventDefault();
    button.releasePointerCapture?.(event.pointerId);
    activePointers.delete(event.pointerId);
    if (activePointers.size === 0) {
      keys.delete(key);
      button.classList.remove("is-down");
      onUp?.();
    }
  };

  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  button.addEventListener("lostpointercapture", (event) => {
    if (activePointers.has(event.pointerId)) up(event);
  });
}

bindHoldButton(leftBtn, "ArrowLeft");
bindJumpButton(jumpBtn);
bindHoldButton(rightBtn, "ArrowRight");
resetBtn.addEventListener("click", resetRun);

resetRun();
requestAnimationFrame(loop);

function bindJumpButton(button) {
  let touchHoldPointers = new Set();
  let mouseStartedCharge = false;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);

    if (event.pointerType === "mouse") {
      if (isCharging && mouseStartedCharge) {
        releaseCharge();
        mouseStartedCharge = false;
      } else {
        beginCharge();
        mouseStartedCharge = isCharging;
      }
      return;
    }

    touchHoldPointers.add(event.pointerId);
    keys.add("Space");
    beginCharge();
  });

  const releaseTouch = (event) => {
    event.preventDefault();
    button.releasePointerCapture?.(event.pointerId);
    if (event.pointerType === "mouse") return;
    touchHoldPointers.delete(event.pointerId);
    if (touchHoldPointers.size === 0) {
      keys.delete("Space");
      releaseCharge();
    }
  };

  button.addEventListener("pointerup", releaseTouch);
  button.addEventListener("pointercancel", releaseTouch);
  button.addEventListener("lostpointercapture", (event) => {
    if (touchHoldPointers.has(event.pointerId)) releaseTouch(event);
  });
}
