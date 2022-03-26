const ctx = document.getElementById('screen').getContext('2d');

let prevFps = 0;
let fps = 0;
let prevTime = Date.now();

const keyCodes = {
  KeyA: 'left',
  KeyW: 'top',
  KeyD: 'right',
  KeyS: 'bottom',
  Space: 'a',
  ShiftRight: 'b',
  ShiftLeft: 'b',
};

const keyStatus = {
  left: false,
  right: false,
  top: false,
  bottom: false,
  a: false,
  b: false,
};

let gamePadIndex;

// ゲームパッドからの入力を保持する
let gameInput = {
  left: false,
  right: false,
  top: false,
  bottom: false,
  a: false,
  b: false,
};

window.addEventListener(
  'keydown',
  (e) => {
    if (!(e.code in keyCodes)) return;

    keyStatus[keyCodes[e.code]] = true;
  },
  false
);

window.addEventListener(
  'keyup',
  (e) => {
    if (!(e.code in keyCodes)) return;

    keyStatus[keyCodes[e.code]] = false;
  },
  false
);

addEventListener('gamepadconnected', (e) => {
  // パッドが接続されたらインデックスを保存
  gamePadIndex = e.gamepad.index;
});

const deg2rad = (degree) => (degree * Math.PI) / 180;

const rx = (x, y, degree) =>
  x * Math.cos(deg2rad(degree)) - y * Math.sin(deg2rad(degree));
const ry = (x, y, degree) =>
  x * Math.sin(deg2rad(degree)) + y * Math.cos(deg2rad(degree));

function drawObject(x, y, degree, backword, color, lines) {
  ctx.beginPath();

  ctx.lineWidth = 1;
  ctx.strokeStyle = color;

  const rxm = (x, y, degree) => rx(x, y, degree) * (backword ? -1 : 1); // x軸反転対応

  for (let line of lines) {
    // 始点へ移動
    const p = line[0];
    ctx.moveTo(x + rxm(p.x, p.y, degree), y + ry(p.x, p.y, degree));

    // 線を残りの座標について引く
    for (let i = 1; i < line.length; i++) {
      to = line[i];
      ctx.lineTo(x + rxm(to.x, to.y, degree), y + ry(to.x, to.y, degree));
    }
  }

  ctx.stroke();
}

const robotImage = [
  [
    { x: -3, y: -16 },
    { x: 2, y: -15 },
    { x: 2, y: -10 },
    { x: -2, y: -10 },
    { x: -3, y: -16 },
  ],
  [
    { x: 4, y: -5 },
    { x: 4, y: 0 },
    { x: -4, y: 0 },
    { x: -4, y: -10 },
    { x: 4, y: -10 },
  ],
  [
    { x: -1, y: 0 },
    { x: 3, y: 0 },
    { x: 4, y: 10 },
    { x: -8, y: 10 },
    { x: -1, y: 0 },
  ],
  [
    { x: 0, y: -10 },
    { x: 10, y: -10 },
    { x: 10, y: -5 },
    { x: 0, y: -5 },
    { x: 0, y: -10 },
  ],
];

const HORIZON_HEIGHT = 200; // 地面の高さ

const gameObjects = [
  { type: 'player', x: 30, y: HORIZON_HEIGHT, ay: 0, r: 0, backward: false },
  { type: 'fps' },
  { type: 'gameInput' },
];

const functions = {
  fps: (obj) => {
    // FPSを画面に描画する
    ctx.fillText('fps: ' + prevFps.toString(), 10, 15);
  },

  gameInput: () => {
    // パッドからの入力を画面に表示する
    let s = '';
    s += gameInput.left ? 'L' : '_';
    s += gameInput.top ? 'T' : '_';
    s += gameInput.right ? 'R' : '_';
    s += gameInput.bottom ? 'B' : '_';
    s += gameInput.a ? 'A' : '_';
    s += gameInput.b ? 'B' : '_';
    ctx.fillText('controller: ' + s, 10, 30);
  },

  player: (obj) => {
    const DRAW_CENTER_HEIGHT = 10;

    // 地面より上にいれば下方向に加速させる
    if (obj.y < HORIZON_HEIGHT) {
      obj.ay += 0.5;
    }

    // 入力に応じでキャラを動かす
    if (gameInput.left) {
      obj.x -= 3;
      obj.backward = true;
    }
    if (gameInput.right) {
      obj.x += 3;
      obj.backward = false;
    }
    if (gameInput.a && obj.y == HORIZON_HEIGHT) {
      obj.ay -= 8;
    }

    obj.y += obj.ay;

    // 地面に着いたら下方向の加速を止める
    if (obj.y > HORIZON_HEIGHT) {
      obj.ay = 0;
      obj.y = HORIZON_HEIGHT;
    }

    drawObject(
      obj.x,
      obj.y - DRAW_CENTER_HEIGHT,
      obj.r,
      obj.backward,
      'rgb(0, 0, 255)',
      robotImage
    );
  },
};

function gameLoop() {
  const begin = Date.now();

  // キーボードから入力を生成する
  gameInput = {
    left: keyStatus.left,
    right: keyStatus.right,
    top: keyStatus.top,
    bottom: keyStatus.bottom,
    a: keyStatus.a,
    b: keyStatus.b,
  };

  if (gamePadIndex !== undefined) {
    // パッドが接続されていればキーボードからの入力と合成する
    const gamePad = navigator.getGamepads()[gamePadIndex];

    gameInput.left |= gamePad.axes[0] < -0.5;
    gameInput.right |= gamePad.axes[0] > 0.5;
    gameInput.top |= gamePad.axes[1] < -0.5;
    gameInput.bottom |= gamePad.axes[1] > 0.5;
    gameInput.a |= gamePad.buttons[1].pressed;
    gameInput.b |= gamePad.buttons[0].pressed;
  }

  ctx.clearRect(0, 0, 320, 240); // 画面を消去

  // ゲームオブジェクトを処理
  gameObjects.forEach((obj) => {
    functions[obj.type](obj);
  });

  // FPS値を計算する
  if (begin - prevTime > 1000) {
    prevFps = fps;
    fps = 1;
    prevTime = begin;
  } else {
    fps++;
  }

  const end = Date.now();
  setTimeout(gameLoop, 33 - (end - begin)); // 0.33msから実際かかった時間を引いた秒数待つ
}

gameLoop();
