const ctx = document.getElementById('screen').getContext('2d');

let prevFps = 0;
let fps = 0;
let prevTime = Date.now();

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

addEventListener('gamepadconnected', (e) => {
  // パッドが接続されたらインデックスを保存
  gamePadIndex = e.gamepad.index;
});

const gameObjects = [{ type: 'player', x: 30, y: 50 }, { type: 'fps' }];

const functions = {
  fps: (obj) => {
    // FPSを画面に描画する
    ctx.fillText('fps: ' + prevFps.toString(), 10, 15);
  },

  player: (obj) => {
    obj.x += 0.2;

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y);
    ctx.lineTo(obj.x, obj.y + 20);
    ctx.stroke();
  },
};

function gameLoop() {
  const begin = Date.now();

  if (gamePadIndex !== undefined) {
    // パッドが接続されていれば入力を取得する
    const gamePad = navigator.getGamepads()[gamePadIndex];
    gameInput = {
      left: gamePad.axes[0] < -0.5,
      right: gamePad.axes[0] > 0.5,
      top: gamePad.axes[1] < -0.5,
      bottom: gamePad.axes[1] > 0.5,
      a: gamePad.buttons[1].pressed === true,
      b: gamePad.buttons[0].pressed === true,
    };
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
