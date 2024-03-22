Pacman.WALL = 0;
Pacman.BISCUIT = 1;
Pacman.EMPTY = 2;
Pacman.BLOCK = 3;
Pacman.PILL = 4;
Pacman.NotReplaceableBiscuit = 5;

const Answers = [
  // ["Answer", correct]
  ["Caspase 8", true],
  ["Caspase 9", false],
  ["FAS ligand", true],
  ["FAS receptor", true],
  ["Cytochrome c", false],
];

AnswerImages = [
  "./img/pacman-apple.png",
  "./img/pacman-cherry.png",
  "./img/pacman-orange.png",
  "./img/pacman-strawbarry.png",
  "./img/pacman-banana.png",
];

Pacman.AnswerSet = Answers.sort(() => Math.random() - 0.5).reduce(
  (acc, answer, i) => {
    acc[`Answer_${i + 1}`] = {
      MapValue: i + 100,
      Description: answer[0],
      correct: answer[1],
      Image: AnswerImages[i],
      eaten: false,
    };
    return acc;
  },
  {}
);

Pacman.TotalCorrectAnswers = // only correct answers (index 1 is true)
  Object.values(Pacman.AnswerSet).filter((answer) => answer["correct"]).length;

// replace random five '1' with AnswerSet (5, 6, 7, 8, 9)
function replaceRandomOnesWithAnswerSet(map, answerSet) {
  // Flatten the 2D map array to a 1D array
  const flatMap = map.flat();

  // Find indices of '1' in the flat map array
  const onesIndices = flatMap.reduce((indices, value, index) => {
    if (value === 1) {
      indices.push(index);
    }
    return indices;
  }, []);

  // Shuffle the array of indices to get random positions
  onesIndices.sort(() => Math.random() - 0.5);

  // Take the first five indices
  const selectedIndices = onesIndices.slice(0, 5);

  // Replace the values at selected indices with AnswerSet values
  selectedIndices.forEach((index, i) => {
    const answerKey = Object.keys(answerSet)[i];
    flatMap[index] = answerSet[answerKey].MapValue;
  });

  // make all 5s to 1s
  flatMap.forEach((value, index) => {
    if (value === Pacman.NotReplaceableBiscuit) {
      flatMap[index] = Pacman.BISCUIT;
    }
  });

  // Convert the 1D array back to a 2D array
  const updatedMap = [];
  while (flatMap.length) {
    updatedMap.push(flatMap.splice(0, map[0].length));
  }

  return updatedMap;
}

function transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map((row) => row[i]));
}

// Replace random '1' with AnswerSet values
Pacman.MAP = replaceRandomOnesWithAnswerSet(
  // transpose(
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 5, 1, 5, 0, 5, 1, 5, 5, 5, 5, 1, 5, 0, 5, 5, 1, 5, 0],
    [0, 5, 0, 0, 5, 0, 5, 0, 0, 0, 0, 0, 0, 5, 0, 5, 0, 0, 5, 0],
    [0, 5, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1, 0, 1, 0],
    [0, 1, 0, 5, 0, 0, 5, 0, 0, 2, 2, 0, 0, 5, 0, 0, 5, 0, 5, 0],
    [0, 5, 5, 5, 1, 1, 5, 0, 2, 2, 2, 2, 0, 5, 1, 1, 5, 5, 5, 0],
    [0, 5, 0, 5, 0, 0, 5, 0, 0, 0, 0, 0, 0, 5, 0, 0, 5, 0, 5, 0],
    [0, 5, 0, 1, 5, 5, 5, 5, 1, 5, 1, 5, 5, 5, 5, 5, 5, 0, 5, 0],
    [0, 5, 0, 0, 5, 0, 5, 0, 0, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1, 0],
    [0, 5, 1, 5, 1, 0, 5, 5, 5, 5, 5, 5, 5, 5, 0, 5, 1, 5, 5, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  Pacman.AnswerSet
);

Pacman.totalFood = Pacman.MAP.reduce((acc, row) => {
  return (
    acc +
    row.reduce((acc, cell) => {
      return (
        acc +
        ([
          Pacman.BISCUIT,
          Pacman.PILL,
          ...Object.values(Pacman.AnswerSet).map((answer) => answer.MapValue),
        ].includes(cell)
          ? 1
          : 0)
      );
    }, 0)
  );
}, 0);

function generateWallsFromMap(map) {
  const walls = [];

  function isWall(x, y) {
    return map[y] && map[y][x] === Pacman.WALL;
  }

  function addWallSegment(x, y, direction) {
    let segment;
    switch (direction) {
      case "up":
        segment = [{ move: [x, y] }, { line: [x + 1, y] }];
        break;
      case "down":
        segment = [{ move: [x, y + 1] }, { line: [x + 1, y + 1] }];
        break;
      case "left":
        segment = [{ move: [x, y] }, { line: [x, y + 1] }];
        break;
      case "right":
        segment = [{ move: [x + 1, y] }, { line: [x + 1, y + 1] }];
        break;
    }
    walls.push(segment);
  }

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (isWall(x, y)) {
        // Check adjacent blocks
        if (!isWall(x, y - 1)) addWallSegment(x, y, "up");
        if (!isWall(x, y + 1)) addWallSegment(x, y, "down");
        if (!isWall(x - 1, y)) addWallSegment(x, y, "left");
        if (!isWall(x + 1, y)) addWallSegment(x, y, "right");
      }
    }
  }

  return walls;
}

// Usage
Pacman.WALLS = generateWallsFromMap(Pacman.MAP);

Pacman.Map = function (size) {
  var height = null,
    width = null,
    blockSize = size,
    pillSize = 0,
    map = null;

  function withinBounds(y, x) {
    return y >= 0 && y < height && x >= 0 && x < width;
  }

  function isWall(pos) {
    return withinBounds(pos.y, pos.x) && map[pos.y][pos.x] === Pacman.WALL;
  }

  function isFloorSpace(pos) {
    if (!withinBounds(pos.y, pos.x)) {
      return false;
    }
    var peice = map[pos.y][pos.x];
    return [
      Pacman.EMPTY,
      Pacman.BISCUIT,
      Pacman.PILL,
      ...Object.values(Pacman.AnswerSet).map((answer) => answer.MapValue),
    ].includes(peice);
  }

  function drawWall(ctx) {
    var i, j, p, line;

    ctx.strokeStyle = "#0000FF";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    for (i = 0; i < Pacman.WALLS.length; i += 1) {
      line = Pacman.WALLS[i];
      ctx.beginPath();

      for (j = 0; j < line.length; j += 1) {
        p = line[j];

        if (p.move) {
          ctx.moveTo(p.move[0] * blockSize, p.move[1] * blockSize);
        } else if (p.line) {
          ctx.lineTo(p.line[0] * blockSize, p.line[1] * blockSize);
        } else if (p.curve) {
          ctx.quadraticCurveTo(
            p.curve[0] * blockSize,
            p.curve[1] * blockSize,
            p.curve[2] * blockSize,
            p.curve[3] * blockSize
          );
        }
      }
      ctx.stroke();
    }
  }

  function reset() {
    map = Pacman.MAP.clone();
    height = map.length;
    width = map[0].length;
  }

  function block(pos) {
    return map[pos.y][pos.x];
  }

  function setBlock(pos, type) {
    map[pos.y][pos.x] = type;
  }

  function drawSpecial(ctx) {
    if (++pillSize > 30) {
      pillSize = 0;
    }

    for (i = 0; i < height; i += 1) {
      for (j = 0; j < width; j += 1) {
        if (
          Object.values(Pacman.AnswerSet)
            .map((answer) => answer.MapValue)
            .includes(map[i][j])
        ) {
          // draw background
          ctx.beginPath();
          ctx.fillStyle = "#000";
          ctx.fillRect(j * blockSize, i * blockSize, blockSize, blockSize);

          if (
            Object.values(Pacman.AnswerSet).find(
              (answer) => answer.MapValue === map[i][j]
            ).Image
          ) {
            // import image
            const img = new Image();
            img.src = Object.values(Pacman.AnswerSet).find(
              (answer) => answer.MapValue === map[i][j]
            ).Image;

            ctx.drawImage(
              img,
              j * blockSize,
              i * blockSize,
              blockSize,
              blockSize
            );
          } else {
            ctx.fillStyle = "#FFF";
            ctx.arc(
              j * blockSize + blockSize / 2,
              i * blockSize + blockSize / 2,
              Math.abs(5 - pillSize / 3),
              0,
              Math.PI * 2,
              false
            );
            ctx.fill();
          }
          ctx.closePath();
        } else if (map[i][j] === Pacman.PILL) {
          ctx.beginPath();

          ctx.fillStyle = "#000";
          ctx.fillRect(j * blockSize, i * blockSize, blockSize, blockSize);

          ctx.fillStyle = "#FFF";
          ctx.arc(
            j * blockSize + blockSize / 2,
            i * blockSize + blockSize / 2,
            Math.abs(5 - pillSize / 3),
            0,
            Math.PI * 2,
            false
          );
          ctx.fill();
          ctx.closePath();
        }
      }
    }
  }

  function draw(ctx) {
    var i,
      j,
      size = blockSize;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width * size, height * size);

    drawWall(ctx);

    for (i = 0; i < height; i += 1) {
      for (j = 0; j < width; j += 1) {
        drawBlock(i, j, ctx);
      }
    }
  }

  function drawBlock(y, x, ctx) {
    var layout = map[y][x];

    if (
      [
        Pacman.PILL,
        ...Object.values(Pacman.AnswerSet).map((answer) => answer.MapValue),
      ].includes(layout)
    ) {
      return;
    }

    ctx.beginPath();

    if ([Pacman.EMPTY, Pacman.BLOCK, Pacman.BISCUIT].includes(layout)) {
      ctx.fillStyle = "#000";
      ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

      if (layout === Pacman.BISCUIT) {
        ctx.fillStyle = "#FFF";
        ctx.fillRect(
          x * blockSize + blockSize / 2.25,
          y * blockSize + blockSize / 2.25,
          blockSize / 10,
          blockSize / 10
        );
      }
    }
    ctx.closePath();
  }

  reset();

  return {
    draw: draw,
    drawBlock: drawBlock,
    drawSpecial: drawSpecial,
    block: block,
    setBlock: setBlock,
    reset: reset,
    isWallSpace: isWall,
    isFloorSpace: isFloorSpace,
    height: height,
    width: width,
    blockSize: blockSize,
  };
};
