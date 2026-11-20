const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;   // keeps pixel art crisp
const scoreEl = document.getElementById("score");

const size = 40;                      // size of each grid cell
const cols = canvas.width / size;     // 12
const rows = canvas.height / size;    // 16

// How tall each sprite is drawn, in cells (1 = fits exactly in one cell)
const headScale = 3;
const bodyScale = 3;
const foodScale = 1.5;

// How many different body characters you have
const bodyVariants = 4;

function loadImg(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const bgImg = loadImg("images/background.png");
const foodImg = loadImg("images/food.png");

const headImgs = {
  up:    loadImg("images/Carlos_back.png"),
  down:  loadImg("images/Carlos_front.png"),
  left:  loadImg("images/Carlos_left.png"),
  right: loadImg("images/Carlos_right.png"),
};

// bodyImgs[0] is variant 1, bodyImgs[1] is variant 2, and so on.
const bodyImgs = [];
for (let v = 1; v <= bodyVariants; v++) {
  bodyImgs.push({
    up:    loadImg(`images/Body${v}_back.png`),
    down:  loadImg(`images/Body${v}_front.png`),
    left:  loadImg(`images/Body${v}_left.png`),
    right: loadImg(`images/Body${v}_right.png`),
  });
}

// Turns a movement like {x: 1, y: 0} into "right", "up", etc.
function dirName(d) {
  if (d.x === 1)  return "right";
  if (d.x === -1) return "left";
  if (d.y === -1) return "up";
  return "down";
}

// Draws one sprite centered on a grid cell, keeping its proportions
function drawSprite(img, cell, scale) {
  if (!img.naturalWidth) return;      // image not loaded yet
  const h = size * scale;
  const w = h * (img.naturalWidth / img.naturalHeight);
  const cx = cell.x * size + size / 2;
  const cy = cell.y * size + size / 2;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

let snake, dir, nextDir, food, score, alive;

function reset() {
  // snake[0] is the head. Body pieces are added when food is eaten.
  snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  alive = true;
  scoreEl.textContent = score;
  placeFood();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function update() {
  if (!alive) return;
  dir = nextDir;
  const nx = snake[0].x + dir.x;
  const ny = snake[0].y + dir.y;

  const hitWall = nx < 0 || ny < 0 || nx >= cols || ny >= rows;
  const hitSelf = snake.some(s => s.x === nx && s.y === ny);
  if (hitWall || hitSelf) {
    alive = false;
    return;
  }

  // remember where the tail is before everything moves
  const last = snake[snake.length - 1];
  const oldTail = { x: last.x, y: last.y };

  // move every piece into the spot of the piece ahead of it (tail first)
  for (let i = snake.length - 1; i > 0; i--) {
    snake[i].x = snake[i - 1].x;
    snake[i].y = snake[i - 1].y;
  }
  snake[0].x = nx;
  snake[0].y = ny;

  // eating food: add ONE new piece at the tail with its own permanent variant
  if (nx === food.x && ny === food.y) {
    snake.push({
      x: oldTail.x,
      y: oldTail.y,
      variant: (snake.length - 1) % bodyVariants,
    });
    score++;
    scoreEl.textContent = score;
    placeFood();
  }
}

function draw() {
  // background
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // food (image)
  drawSprite(foodImg, food, foodScale);

  // body: from the tail up to the piece behind the head
  for (let i = snake.length - 1; i > 0; i--) {
    const piece = snake[i];
    const ahead = snake[i - 1];
    const facing = dirName({
      x: ahead.x - piece.x,
      y: ahead.y - piece.y,
    });
    drawSprite(bodyImgs[piece.variant][facing], piece, bodyScale);
  }

  // head, drawn last so it sits on top
  drawSprite(headImgs[dirName(dir)], snake[0], headScale);

  if (!alive) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
    ctx.fillStyle = "#fff";
    ctx.font = "28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER - PRESS SPACE", canvas.width / 2, canvas.height / 2 + 10);
  }
}

document.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if ((k === "arrowup" || k === "w") && dir.y !== 1)    nextDir = { x: 0, y: -1 };
  if ((k === "arrowdown" || k === "s") && dir.y !== -1) nextDir = { x: 0, y: 1 };
  if ((k === "arrowleft" || k === "a") && dir.x !== 1)  nextDir = { x: -1, y: 0 };
  if ((k === "arrowright" || k === "d") && dir.x !== -1) nextDir = { x: 1, y: 0 };
  if (k === " " && !alive) reset();
  if (e.key.startsWith("Arrow") || k === " ") e.preventDefault();
});

reset();
setInterval(() => { update(); draw(); }, 100);