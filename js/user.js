Pacman.User = function (game, map, homePos) {
  var position = null,
    direction = null,
    eaten = null,
    due = null,
    lives = null,
    score = 5,
    correctAnswerEaten = 0;

  function addScore(nScore) {
    score += nScore;
    // if (score >= 10000 && score - nScore < 10000) {
    //   lives += 1;
    // }
  }

  function theScore() {
    return score;
  }

  function loseLife() {
    lives -= 1;
  }

  function eatenCorrectAnswer() {
    correctAnswerEaten += 1;
    if (
      // eaten === totalFood
      correctAnswerEaten >= Pacman.TotalCorrectAnswers
    ) {
      // console.log("You Win");
      state = PAUSE;
      const successAudio = new Audio("./audio/success.mp3");
      successAudio.play();
      const hint = document.querySelectorAll(".Hint")[0];
      hint.style.display = "flex";
      document.querySelector(".showHint").style.display = "none";
      hint.innerHTML = `<div class="container"><img src="./img/gamesucessful.svg" alt="You Win" /></div>`;
      submitSCORM(true);
    }
  }

  function getLives() {
    return lives;
  }

  function initUser() {
    score = 0;
    lives = 1;
    correctAnswerEaten = 0;
    newLevel();
  }

  function newLevel() {
    resetPosition();
    eaten = 0;
  }

  function resetPosition() {
    // starting position of pacman
    position = homePos
      ? { x: homePos.x * 10, y: homePos.y * 10 }
      : { x: 90, y: 60 };
    direction = LEFT;
    due = LEFT;
  }

  function reset() {
    initUser();
    resetPosition();
  }

  function keyDown(keyCode, e) {
    if (typeof keyCode !== "undefined") {
      due = keyCode;

      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      return false;
    }
    return true;
  }

  function getNewCoord(dir, current) {
    return {
      x: current.x + ((dir === LEFT && -2) || (dir === RIGHT && 2) || 0),
      y: current.y + ((dir === DOWN && 2) || (dir === UP && -2) || 0),
    };
  }

  function onWholeSquare(x) {
    return x % 10 === 0;
  }

  function pointToCoord(x) {
    return Math.round(x / 10);
  }

  function nextSquare(x, dir) {
    var rem = x % 10;
    if (rem === 0) {
      return x;
    } else if (dir === RIGHT || dir === DOWN) {
      return x + (10 - rem);
    } else {
      return x - rem;
    }
  }

  function next(pos, dir) {
    return {
      y: pointToCoord(nextSquare(pos.y, dir)),
      x: pointToCoord(nextSquare(pos.x, dir)),
    };
  }

  function onGridSquare(pos) {
    return onWholeSquare(pos.y) && onWholeSquare(pos.x);
  }

  function isOnSamePlane(due, dir) {
    return (
      ((due === LEFT || due === RIGHT) && (dir === LEFT || dir === RIGHT)) ||
      ((due === UP || due === DOWN) && (dir === UP || dir === DOWN))
    );
  }

  function move(ctx) {
    var npos = null,
      nextWhole = null,
      onGrid = onGridSquare(position),
      oldPosition = position,
      block = null;

    if (due !== direction) {
      npos = getNewCoord(due, position);

      if (
        isOnSamePlane(due, direction) ||
        (onGrid && map.isFloorSpace(next(npos, due)))
      ) {
        direction = due;
      } else {
        npos = null;
      }
    }

    if (npos === null) {
      npos = getNewCoord(direction, position);
    }

    if (onGrid && map.isWallSpace(next(npos, direction))) {
      direction = NONE;
    }

    if (direction === NONE) {
      return { new: position, old: position };
    }

    // if (npos.y === 100 && npos.x >= 190 && direction === RIGHT) {
    //   npos = { y: 100, x: -10 };
    // }

    // if (npos.y === 100 && npos.x <= -12 && direction === LEFT) {
    //   npos = { y: 100, x: 190 };
    // }

    if (npos.y <= 0) {
      npos = { y: Pacman.MAP.length * 10, x: npos.x };
    } else if (npos.y > Pacman.MAP.length * 10) {
      npos = { y: 0, x: npos.x };
    }

    if (npos.x <= 0) {
      npos = { y: npos.y, x: Pacman.MAP[0].length * 10 };
    } else if (npos.x >= Pacman.MAP[0].length * 10) {
      npos = { y: npos.y, x: 0 };
    }

    position = npos;
    nextWhole = next(position, direction);

    block = map.block(nextWhole);
    // console.log(npos, direction);

    if (
      (isMidSquare(position.y) || isMidSquare(position.x)) &&
      [
        Pacman.BISCUIT,
        Pacman.PILL,
        ...Object.values(Pacman.AnswerSet).map((answer) => answer.MapValue),
      ].includes(block)
    ) {
      map.setBlock(nextWhole, Pacman.EMPTY);
      // addScore(block === Pacman.BISCUIT ? 10 : 50);
      eaten += 1;

      // const totalFood = Pacman.totalFood;

      // When eaten all correct answers, game is completed

      // When eaten a wrong answer, game is over

      if (block === Pacman.PILL) {
        game.eatenPill();
      } else if (
        Object.values(Pacman.AnswerSet)
          .map((answer) => answer.MapValue)
          .includes(block)
      ) {
        game.eatenAnswer(block);
      }
    }

    return {
      new: position,
      old: oldPosition,
    };
  }

  function isMidSquare(x) {
    var rem = x % 10;
    return rem > 3 || rem < 7;
  }

  function calcAngle(dir, pos) {
    if (dir == RIGHT && pos.x % 10 < 5) {
      return { start: 0.25, end: 1.75, direction: false };
    } else if (dir === DOWN && pos.y % 10 < 5) {
      return { start: 0.75, end: 2.25, direction: false };
    } else if (dir === UP && pos.y % 10 < 5) {
      return { start: 1.25, end: 1.75, direction: true };
    } else if (dir === LEFT && pos.x % 10 < 5) {
      return { start: 0.75, end: 1.25, direction: true };
    }
    return { start: 0, end: 2, direction: false };
  }

  function drawDead(ctx, amount) {
    var size = map.blockSize,
      half = size / 2;

    if (amount >= 1) {
      return;
    }

    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();
    ctx.moveTo(
      (position.x / 10) * size + half,
      (position.y / 10) * size + half
    );

    ctx.arc(
      (position.x / 10) * size + half,
      (position.y / 10) * size + half,
      half,
      0,
      Math.PI * 2 * amount,
      true
    );

    ctx.fill();
  }

  function draw(ctx) {
    var s = map.blockSize,
      angle = calcAngle(direction, position);

    ctx.fillStyle = "#FFFF00";

    ctx.beginPath();

    ctx.moveTo((position.x / 10) * s + s / 2, (position.y / 10) * s + s / 2);

    ctx.arc(
      (position.x / 10) * s + s / 2,
      (position.y / 10) * s + s / 2,
      s / 2,
      Math.PI * angle.start,
      Math.PI * angle.end,
      angle.direction
    );

    ctx.fill();
  }

  initUser();

  return {
    draw: draw,
    drawDead: drawDead,
    loseLife: loseLife,
    getLives: getLives,
    eatenCorrectAnswer: eatenCorrectAnswer,
    score: score,
    addScore: addScore,
    theScore: theScore,
    keyDown: keyDown,
    move: move,
    newLevel: newLevel,
    reset: reset,
    resetPosition: resetPosition,
  };
};
