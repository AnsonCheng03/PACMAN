var NONE = 4,
  UP = 3,
  LEFT = 2,
  DOWN = 1,
  RIGHT = 11,
  WAITING = 5,
  PAUSE = 6,
  PLAYING = 7,
  COUNTDOWN = 8,
  EATEN_PAUSE = 9,
  DYING = 10,
  Pacman = {};

Pacman.FPS = 24;

/* Human readable keyCode index */
let KEY = {
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_RIGHT: 39,
  ARROW_DOWN: 40,
};

/* A - Z */
for (i = 65; i <= 90; i++) {
  KEY["" + String.fromCharCode(i)] = i;
}

Object.prototype.clone = function () {
  var i,
    newObj = this instanceof Array ? [] : {};
  for (i in this) {
    if (i === "clone") {
      continue;
    }
    if (this[i] && typeof this[i] === "object") {
      newObj[i] = this[i].clone();
    } else {
      newObj[i] = this[i];
    }
  }
  return newObj;
};
