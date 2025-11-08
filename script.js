const video = document.getElementById("video");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");

let model;
let hand = { present:false, pinch:false, x:0, y:0 };
let objects = [];

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
window.onresize = resize;

function spawnObject() {
  objects.push({
    x: Math.random() * canvas.width,
    y: -20,
    r: 15 + Math.random() * 15,
    vy: 2 + Math.random() * 3
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    o.y += o.vy;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD166";
    ctx.fill();

    if (hand.present && hand.pinch) {
      const dx = o.x - hand.x;
      const dy = o.y - hand.y;
      if (Math.hypot(dx, dy) < o.r + 20) {
        objects.splice(i, 1);
      }
    }
    if (o.y > canvas.height + 50) objects.splice(i, 1);
  }

  if (hand.present) {
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = hand.pinch ? "#FF6B6B" : "#00E0FF";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}

async function startGame() {
  startBtn.style.display = "none";
  statusEl.textContent = "Loading model...";

  model = await Yoha.init({ backend: "tfjs", debug: false });

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await video.play();

  statusEl.textContent = "Ready!";
  model.start(video, { onFrame: onFrame });
  setInterval(spawnObject, 1000);
  draw();
}

function onFrame(result) {
  if (!result.hands || result.hands.length === 0) {
    hand.present = false;
    return;
  }

  const h = result.hands[0];
  hand.present = true;

  const tip = h.landmarks[8]; // index fingertip
  hand.x = tip[0] * canvas.width;
  hand.y = tip[1] * canvas.height;

  // Simple pinch detector
  const thumb = h.landmarks[4];
  const dist = Math.hypot(
    (thumb[0] - tip[0]) * canvas.width,
    (thumb[1] - tip[1]) * canvas.height
  );
  hand.pinch = dist < 40;
}

startBtn.onclick = startGame;
