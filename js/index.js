/*jslint browser: true, undef: true, eqeqeq: true, nomen: true, white: true */
/*global window: false, document: false */

/*
 * fix looped audio
 * add fruits + levels
 * fix what happens when a ghost is eaten (should go back to base)
 * do proper ghost mechanics (blinky/wimpy etc)
 */

var state = WAITING,
  ghosts = [],
  ghostSpecs = [
    {
      img: "./img/ghost_1.svg",
      home: {
        x: Math.floor(Pacman.MAP[0].length / 2) - 1,
        y: Math.floor(Pacman.MAP.length / 2),
      },
    },
    {
      img: "./img/ghost_2.svg",
      home: {
        x: Math.floor(Pacman.MAP[0].length / 2),
        y: Math.floor(Pacman.MAP.length / 2),
      },
    },
  ],
  userHomePos = {
    x: Math.floor(Pacman.MAP[0].length / 2),
    y: Pacman.MAP.length - 2,
  },
  eatenCount = 0,
  level = 0,
  tick = 0,
  ghostPos,
  userPos,
  stateChanged = true,
  timerStart = null,
  lastTime = 0,
  ctx = null,
  timer = null,
  map = null,
  user = null,
  stored = null,
  xDown = null,
  yDown = null,
  evt = null,
  keyMap = {
    37: LEFT,
    38: UP,
    39: RIGHT,
    40: DOWN,
  };

function getTick() {
  return tick;
}

function drawScore(text, position) {
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "12px BDCartoonShoutRegular";
  ctx.fillText(
    text,
    (position["new"]["x"] / 10) * map.blockSize,
    ((position["new"]["y"] + 5) / 10) * map.blockSize
  );
}

function dialog(text) {
  ctx.fillStyle = "#FFFF00";
  ctx.font = "14px BDCartoonShoutRegular";
  var width = ctx.measureText(text).width,
    x = (map.width * map.blockSize - width) / 2;
  ctx.fillText(text, x, map.height * 10 + 14);
}

function startLevel() {
  user.resetPosition();
  for (var i = 0; i < ghosts.length; i += 1) {
    ghosts[i].reset();
  }
  timerStart = tick;
  setState(COUNTDOWN);
}

function startNewGame() {
  setState(WAITING);
  level = 1;
  user.reset();
  map.reset();
  map.draw(ctx);
  startLevel();
}

function keyDown(e) {
  if (e.keyCode === KEY.H && state === PAUSE) {
    map.draw(ctx);
    // setState(stored);
  } else if (e.keyCode === KEY.H) {
    showHint();
  } else if (state !== PAUSE) {
    return user.keyDown(keyMap[e.keyCode], e);
  }
  return true;
}

function handleTouchStart(evt) {
  const firstTouch = evt.touches || evt.originalEvent.touches;
  xDown = firstTouch[0].clientX;
  yDown = firstTouch[0].clientY;
}

function handleTouchMove(evt) {
  if (!xDown || !yDown) {
    return;
  }
  const firstTouch = evt.touches || evt.originalEvent.touches;

  var xUp = firstTouch[0].clientX;
  var yUp = firstTouch[0].clientY;

  var xDiff = xDown - xUp;
  var yDiff = yDown - yUp;

  /* reset values */
  xDown = null;
  yDown = null;

  if (state == PAUSE) {
    return;
  }

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    /*most significant*/
    if (xDiff > 0) {
      return user.keyDown(LEFT);
    } else {
      return user.keyDown(RIGHT);
    }
  } else {
    if (yDiff > 0) {
      return user.keyDown(UP);
    } else {
      return user.keyDown(DOWN);
    }
  }
}

function loseLife() {
  setState(WAITING);
  user.loseLife();
  if (user.getLives() > 0) {
    startLevel();
  }
}

function setState(nState) {
  state = nState;
  stateChanged = true;
}

function collided(user, ghost) {
  return (
    Math.sqrt(Math.pow(ghost.x - user.x, 2) + Math.pow(ghost.y - user.y, 2)) <
    10
  );
}

function drawFooter() {
  var topLeft = map.height * map.blockSize,
    textBase = topLeft + 17;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, topLeft, map.width * map.blockSize, 30);

  ctx.fillStyle = "#FFFF00";

  for (var i = 0, len = user.getLives(); i < len; i++) {
    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();
    ctx.moveTo(
      150 + 25 * i + map.blockSize / 2,
      topLeft + 1 + map.blockSize / 2
    );

    ctx.arc(
      150 + 25 * i + map.blockSize / 2,
      topLeft + 1 + map.blockSize / 2,
      map.blockSize / 2,
      Math.PI * 0.25,
      Math.PI * 1.75,
      false
    );
    ctx.fill();
  }

  ctx.fillStyle = "#FFFF00";
  ctx.font = "14xpx BDCartoonShoutRegular";
  ctx.fillText("Score: " + user.theScore(), 30, textBase);
  ctx.fillText("Level: " + level, 260, textBase);
}

function redrawBlock(pos) {
  map.drawBlock(Math.floor(pos.y / 10), Math.floor(pos.x / 10), ctx);
  map.drawBlock(Math.ceil(pos.y / 10), Math.ceil(pos.x / 10), ctx);
}

function mainDraw() {
  var diff, u, i, len, nScore;

  ghostPos = [];

  for (i = 0, len = ghosts.length; i < len; i += 1) {
    ghostPos.push(ghosts[i].move(ctx));
  }
  u = user.move(ctx);

  for (i = 0, len = ghosts.length; i < len; i += 1) {
    redrawBlock(ghostPos[i].old);
  }
  redrawBlock(u.old);

  for (i = 0, len = ghosts.length; i < len; i += 1) {
    ghosts[i].draw(ctx);
  }
  user.draw(ctx);

  userPos = u["new"];

  for (i = 0, len = ghosts.length; i < len; i += 1) {
    if (collided(userPos, ghostPos[i]["new"])) {
      if (ghosts[i].isVunerable()) {
        ghosts[i].eat();
        eatenCount += 1;
        nScore = eatenCount * 50;
        drawScore(nScore, ghostPos[i]);
        user.addScore(nScore);
        setState(EATEN_PAUSE);
        timerStart = tick;
      } else if (ghosts[i].isDangerous()) {
        setState(DYING);
        timerStart = tick;
      }
    }
  }
}

function mainLoop() {
  var diff;

  if (state !== PAUSE) {
    ++tick;
  }

  map.drawSpecial(ctx);

  if (state === PLAYING) {
    mainDraw();
  } else if (state === WAITING && stateChanged) {
    stateChanged = false;
    const gameOverAudio = new Audio("./audio/fail.mp3");
    gameOverAudio.play();
    const hint = document.querySelectorAll(".Hint")[0];
    hint.style.display = "flex";
    document.querySelector(".showHint").style.display = "none";
    hint.innerHTML = `<div class="container"><img src="./img/gameover.svg" alt="Game Over" /><button onclick="location.reload();">Retry</button></div>`;
    submitSCORM(false);
  } else if (state === EATEN_PAUSE && tick - timerStart > Pacman.FPS / 3) {
    map.draw(ctx);
    setState(PLAYING);
  } else if (state === DYING) {
    if (tick - timerStart > Pacman.FPS * 2) {
      loseLife();
    } else {
      redrawBlock(userPos);
      for (i = 0, len = ghosts.length; i < len; i += 1) {
        redrawBlock(ghostPos[i].old);
        ghostPos.push(ghosts[i].draw(ctx));
      }
      user.drawDead(ctx, (tick - timerStart) / (Pacman.FPS * 2));
    }
  } else if (state === COUNTDOWN) {
    // diff = 3 + Math.floor((timerStart - tick) / Pacman.FPS);

    // if (diff === 0) {
    map.draw(ctx);
    setState(PLAYING);
    // } else {
    //   if (diff !== lastTime) {
    //     lastTime = diff;
    //     map.draw(ctx);
    //     dialog("Starting in: " + diff);
    //   }
    // }
  }

  // drawFooter();
}

function eatenPill() {
  timerStart = tick;
  eatenCount = 0;
  for (i = 0; i < ghosts.length; i += 1) {
    ghosts[i].makeEatable(ctx);
  }
}

function eatenAnswer(Answer) {
  Pacman.AnswerSet[`Answer_${Answer - 99}`].eaten = true;
  if (Pacman.AnswerSet[`Answer_${Answer - 99}`].correct) {
    user.eatenCorrectAnswer();
  } else {
    setState(DYING);
    timerStart = tick;
  }
}

function completedLevel() {
  setState(WAITING);
  level += 1;
  map.reset();
  user.newLevel();
  startLevel();
}

function keyPress(e) {
  if (state !== WAITING && state !== PAUSE) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function init(wrapper) {
  var i,
    len,
    ghost,
    blockSize = wrapper.offsetWidth / (Pacman.MAP[0].length - 2),
    canvas = document.createElement("canvas");

  if (blockSize * Pacman.MAP.length > window.innerHeight) {
    blockSize = window.innerHeight / (Pacman.MAP.length + 2);
  }

  canvas.setAttribute("width", blockSize * Pacman.MAP[0].length + "px");
  canvas.setAttribute(
    "height",
    blockSize * Pacman.MAP.length +
      // + 30
      "px"
  );

  wrapper.appendChild(canvas);

  ctx = canvas.getContext("2d");

  map = new Pacman.Map(blockSize);
  user = new Pacman.User(
    {
      completedLevel: completedLevel,
      eatenPill: eatenPill,
      eatenAnswer: eatenAnswer,
    },
    map,
    userHomePos
  );

  for (i = 0, len = ghostSpecs.length; i < len; i += 1) {
    ghost = new Pacman.Ghost({ getTick: getTick }, map, ghostSpecs[i]);
    ghosts.push(ghost);
  }

  map.draw(ctx);
  dialog("Loading ...");

  document.addEventListener("keydown", keyDown, true);
  document.addEventListener("keypress", keyPress, true);
  document.addEventListener("touchstart", handleTouchStart, false);
  document.addEventListener("touchmove", handleTouchMove, false);

  timer = window.setInterval(mainLoop, 1000 / Pacman.FPS);

  if (state == WAITING) {
    // window.alert("Click to start");
    startNewGame();
  }
  // setInterval(function () {
  // console.log(state);
  // }, 500);
}

const hintButtonClicked = () => {
  document.querySelector(".Hint").style.display = "none";
  document.querySelector(".showHint").style.display = "flex";
  if (state == WAITING) {
    init(document.getElementById("pacman"));
  } else {
    map.draw(ctx);
    setState(stored);
  }
};

function initGame() {
  const hintItems = document.querySelectorAll(".Hint ul");
  Object.values(Pacman.AnswerSet)
    .sort(() => Math.random() - 0.5)
    .forEach((answer) => {
      const li = document.createElement("li");
      li.innerHTML = `<img src="${answer.Image}" alt="${answer.Description}" /> ${answer.Description}`;
      hintItems[0].appendChild(li);
    });
}

function showHint() {
  stored = state;
  setState(PAUSE);
  map.draw(ctx);
  document.querySelector(".Hint").style.display = "flex";
  document.querySelector(".showHint").style.display = "none";
}

function submitSCORM(win) {
  let i = 0;
  const AnswerSet = Object.values(Pacman.AnswerSet);
  AnswerSet.forEach((element) => {
    SCOSetValue(
      `cmi.interactions.${i}.id`,
      `${element.Description} (${element.correct ? "" : "in"}correct)`
    );
    SCOSetValue(`cmi.interactions.${i}.type`, "fill-in");
    SCOSetValue(
      `cmi.interactions.${i}.student_response`,
      `${element.eaten ? "eaten" : "not eaten"}`
    );
    SCOSetValue(
      `cmi.interactions.${i}.result`,
      `${
        (element.correct && element.eaten) ||
        (!element.correct && !element.eaten)
          ? "correct"
          : "wrong"
      }`
    );
    i++;
  });
  SCOSetValue("cmi.core.score.raw", win ? 100 : 0);
  SCOSetValue("cmi.core.score.max", AnswerSet.length);
  SCOSetValue("cmi.core.lesson_status", "completed");
}
