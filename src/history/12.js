const ctx = document.getElementById('screen').getContext('2d');

let prevFps = 0;
let fps = 0;
let prevTime = Date.now();

const keyCodes = {
  KeyA: 'l_left',
  KeyW: 'l_top',
  KeyD: 'l_right',
  KeyS: 'l_bottom',
  ArrowLeft: 'r_left',
  ArrowUp: 'r_top',
  ArrowRight: 'r_right',
  ArrowDown: 'r_bottom',
  Space: 'a',
  ShiftRight: 'b',
  ShiftLeft: 'b',
};

const keyStatus = {
  l_left: false,
  l_right: false,
  l_top: false,
  l_bottom: false,
  r_left: false,
  r_right: false,
  r_top: false,
  r_bottom: false,
  a: false,
  b: false,
};

let gamePadIndex;

// ゲームパッドからの入力を保持する
let gameInput = {
  l_left: false,
  l_right: false,
  l_top: false,
  l_bottom: false,
  r_left: false,
  r_right: false,
  r_top: false,
  r_bottom: false,
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

function hitCheck(linesA, linesB) {
  for (let lineA of linesA) {
    for (let lineB of linesB) {
      const vAx = lineA.ex - lineA.bx;
      const vAy = lineA.ey - lineA.by;
      const vBBx = lineB.bx - lineA.bx;
      const vBBy = lineB.by - lineA.by;
      const vBEx = lineB.ex - lineA.bx;
      const vBEy = lineB.ey - lineA.by;
      const vAvBc0 = vAx * vBBy - vAy * vBBx;
      const vAvBc1 = vAx * vBEy - vAy * vBEx;
      if (vAvBc0 * vAvBc1 > 0) continue;

      const vBx = lineB.ex - lineB.bx;
      const vBy = lineB.ey - lineB.by;
      const vABx = lineA.bx - lineB.bx;
      const vABy = lineA.by - lineB.by;
      const vAEx = lineA.ex - lineB.bx;
      const vAEy = lineA.ey - lineB.by;
      const vBvAc0 = vBx * vABy - vBy * vABx;
      const vBvAc1 = vBx * vAEy - vBy * vAEx;
      if (vBvAc0 * vBvAc1 > 0) continue;

      return true;
    }
  }

  return false;
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

const HORIZON_HEIGHT = 220; // 地面の高さ

let gameObjects = [
  {
    type: 'player',
    x: 30,
    y: HORIZON_HEIGHT,
    ax: 0,
    ay: 0,

    r: 0,
    backward: false,
    fireCounter: 0,

    color: 'rgb(0, 0, 255)',
    layer: 0,
  },
  {
    type: 'enemy',
    x: 290,
    y: HORIZON_HEIGHT,
    ax: 0,
    ay: 0,

    r: 0,
    backward: true,
    fireCounter: 0,

    color: 'rgb(150, 0, 0)',
    layer: 1,
  },
  { type: 'fps' },
  { type: 'gameInput' },
];
let newObjects = [];

const functions = {
  fps: (obj) => {
    // 内部情報を画面に描画する
    ctx.fillText(
      `fps: ${prevFps.toString()}, Objects: ${gameObjects.length}`,
      10,
      15
    );

    return true;
  },

  gameInput: () => {
    // パッドからの入力を画面に表示する
    let s = '';
    s += gameInput.l_left ? 'L' : '_';
    s += gameInput.l_top ? 'T' : '_';
    s += gameInput.l_right ? 'R' : '_';
    s += gameInput.l_bottom ? 'B' : '_';
    s += gameInput.r_left ? 'l' : '_';
    s += gameInput.r_top ? 't' : '_';
    s += gameInput.r_right ? 'r' : '_';
    s += gameInput.r_bottom ? 'b' : '_';
    s += gameInput.a ? 'A' : '_';
    s += gameInput.b ? 'B' : '_';
    ctx.fillText('controller: ' + s, 10, 30);

    return true;
  },

  player: (obj, input) => {
    const DRAW_CENTER_HEIGHT = 10;

    input = input || gameInput;

    const mirror = obj.backward ? -1 : 1;

    // 入力に応じでキャラを動かす
    {
      // 左右移動
      if (input.l_left) {
        if (-3 < obj.ax && obj.ax < 0) {
          obj.ax = -3;
        } else {
          obj.ax -= 0.5;
        }
        obj.backward = true;
      }
      if (input.l_right) {
        if (0 < obj.ax && obj.ax < 3) {
          obj.ax = 3;
        } else {
          obj.ax += 0.5;
        }
        obj.backward = false;
      }

      // 上昇
      if (input.l_top) {
        obj.ay -= 1.6;
      }

      // 回転
      if (input.r_left) {
        obj.backward = true;
      }
      if (input.r_right) {
        obj.backward = false;
      }
      if (input.r_top) {
        obj.r -= 8;
      }
      if (input.r_bottom) {
        obj.r += 8;
      }
      if (obj.r < -40) obj.r = -40;
      if (obj.r > 40) obj.r = 40;
    }

    // 弾を打つ
    if (input.b && obj.fireCounter === 0) {
      obj.fireCounter = 10;
    }
    if (obj.fireCounter > 5) {
      newObjects.push({
        type: 'bullet',
        x: obj.x + rx(0, -10, obj.r) * mirror,
        y: obj.y - DRAW_CENTER_HEIGHT + ry(0, -10, obj.r),
        ax: rx(30, 0, obj.r) * mirror,
        ay: ry(30, 0, obj.r),
        backward: obj.backward,
        r: obj.r,
        layer: obj.layer,
      });

      // 反動を付与
      obj.ax += rx(-2, -0.3, obj.r) * mirror;
      obj.ay += ry(-2, -0.3, obj.r);
    }
    if (obj.fireCounter > 0) obj.fireCounter--;

    // 重力
    if (obj.y < HORIZON_HEIGHT) {
      // 地面より上にいれば下方向に加速させる
      obj.ay += 0.6;
    }

    // 横方向の減衰
    if (obj.ax != 0) obj.ax = obj.ax * 0.8;

    // 加速度を反映
    obj.x += obj.ax;
    obj.y += obj.ay;

    // 地面に着いたら加速を止める
    if (obj.y > HORIZON_HEIGHT) {
      obj.ax = 0;
      obj.ay = 0;
      obj.y = HORIZON_HEIGHT;
    }

    drawObject(
      obj.x,
      obj.y - DRAW_CENTER_HEIGHT,
      obj.r,
      obj.backward,
      obj.color,
      robotImage
    );

    return true;
  },

  enemy: (obj) => {
    const input = {};

    const target_x = 250;
    const target_y = 200;

    const target_distance_x = Math.abs(target_x - obj.x);

    // x座標がズレていたら左右の入力を生成
    if (target_x < obj.x && target_distance_x > 6) {
      input.l_left = true;
      input.l_right = false;
    } else if (target_distance_x > 6) {
      input.l_left = false;
      input.l_right = true;
    }

    // y座標が足りてなければ上昇入力を生成
    if (target_y < obj.y) {
      input.l_top = true;
    } else {
      input.l_top = false;
    }

    return functions.player(obj, input);
  },

  bullet: (obj) => {
    if (obj.hit) {
      return false;
    }

    obj.x += obj.ax;
    obj.y += obj.ay;

    // 弾を画面に描画
    drawObject(obj.x, obj.y, obj.r, obj.backward, 'rgb(0, 0, 255)', [
      [
        { x: 0, y: 0 },
        { x: -20, y: 0 },
      ],
    ]);

    // 画面外に出たら消す
    if (obj.x < -20 || obj.x > 340 || obj.y < -20 || obj.y > 260) {
      return false;
    }

    return true;
  },
};

const hitCheckFunctions = {
  player: (obj, attack) => {
    // 相手の弾とだけ判定をとる
    if (attack.type !== 'bullet' || obj.layer === attack.layer) return;

    const DRAW_CENTER_HEIGHT = 10;
    const mirror = obj.backward ? -1 : 1;

    // キャラクタの当たり判定は長方形
    const charHitLines = [
      {
        bx: obj.x + rx(-5, -15, obj.r) * mirror,
        by: obj.y + ry(-5, -15, obj.r) - DRAW_CENTER_HEIGHT,
        ex: obj.x + rx(5, -15, obj.r) * mirror,
        ey: obj.y + ry(5, -15, obj.r) - DRAW_CENTER_HEIGHT,
      },
      {
        bx: obj.x + rx(5, -15, obj.r) * mirror,
        by: obj.y + ry(5, -15, obj.r) - DRAW_CENTER_HEIGHT,
        ex: obj.x + rx(5, 10, obj.r) * mirror,
        ey: obj.y + ry(5, 10, obj.r) - DRAW_CENTER_HEIGHT,
      },
      {
        bx: obj.x + rx(5, 10, obj.r) * mirror,
        by: obj.y + ry(5, 10, obj.r) - DRAW_CENTER_HEIGHT,
        ex: obj.x + rx(-5, 10, obj.r) * mirror,
        ey: obj.y + ry(-5, 10, obj.r) - DRAW_CENTER_HEIGHT,
      },
      {
        bx: obj.x + rx(-5, 10, obj.r) * mirror,
        by: obj.y + ry(-5, 10, obj.r) - DRAW_CENTER_HEIGHT,
        ex: obj.x + rx(-5, -15, obj.r) * mirror,
        ey: obj.y + ry(-5, -15, obj.r) - DRAW_CENTER_HEIGHT,
      },
    ];

    // 弾の当たり判定は線
    const bulletHitLines = [
      {
        bx: attack.x,
        by: attack.y,
        ex: attack.x - attack.ax,
        ey: attack.y - attack.ay,
      },
    ];

    if (hitCheck(charHitLines, bulletHitLines)) {
      // 当たっていたら相手を若干後ろに押す
      obj.ax += attack.ax / 10;
      obj.ay += attack.ay / 10;

      obj.hit = true;
      attack.hit = true;
    }
  },

  enemy: (obj, attack) => {
    hitCheckFunctions.player(obj, attack);
  },
};

function gameLoop() {
  const begin = Date.now();

  // キーボードから入力を生成する
  gameInput = {
    l_left: keyStatus.l_left,
    l_right: keyStatus.l_right,
    l_top: keyStatus.l_top,
    l_bottom: keyStatus.l_bottom,
    r_left: keyStatus.r_left,
    r_right: keyStatus.r_right,
    r_top: keyStatus.r_top,
    r_bottom: keyStatus.r_bottom,
    a: keyStatus.a,
    b: keyStatus.b,
  };

  if (gamePadIndex !== undefined) {
    // パッドが接続されていればキーボードからの入力と合成する
    const gamePad = navigator.getGamepads()[gamePadIndex];

    gameInput.l_left |= gamePad.axes[0] < -0.5;
    gameInput.l_right |= gamePad.axes[0] > 0.5;
    gameInput.l_top |= gamePad.axes[1] < -0.5;
    gameInput.l_bottom |= gamePad.axes[1] > 0.5;
    gameInput.r_left |= gamePad.axes[2] < -0.5;
    gameInput.r_right |= gamePad.axes[2] > 0.5;
    gameInput.r_top |= gamePad.axes[3] < -0.5;
    gameInput.r_bottom |= gamePad.axes[3] > 0.5;
    gameInput.a |= gamePad.buttons[1].pressed;
    gameInput.b |= gamePad.buttons[0].pressed;
  }

  ctx.clearRect(0, 0, 320, 240); // 画面を消去

  // ゲームオブジェクトを処理
  newObjects = [];
  gameObjects.forEach((obj) => {
    if (functions[obj.type](obj)) {
      newObjects.push(obj);
    }
  });
  gameObjects = newObjects;

  // 攻撃判定
  gameObjects.forEach((defence) => {
    gameObjects.forEach((attack) => {
      if (defence === attack || !hitCheckFunctions[defence.type]) {
        return;
      }
      hitCheckFunctions[defence.type](defence, attack);
    });
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
