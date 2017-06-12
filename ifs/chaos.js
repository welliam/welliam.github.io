function run(state, map, next, times) {
  var results = [];
  while(times--) {
    results.push(map(state = next(state)));
  }
  return results;
}

function point(x, y) {
  return {x: x, y: y};
}

function midpoint(p1, p2, i, part) {
  i = i || 1;
  part = part || 2;
  return {
    x: (p2.x - p1.x) * i / part + p1.x,
    y: (p2.y - p1.y) * i / part + p1.y
  }
}

function line(x, y, angle, magnitude) {
  return {
    x: x,
    y: y,
    angle: angle,
    magnitude: magnitude
  };
}

function getLineEnd(s) {
  return {
    x: s.x + Math.cos(s.angle) * s.magnitude,
    y: s.y + Math.sin(s.angle) * s.magnitude
  };
}

//////////////////////////////////////////////////
// plant

function nextStem(s, nthStem, parts, left) {
  var midway = midpoint(s, getLineEnd(s), nthStem, parts),
      angleChange = Math.PI*s.magnitude,
      angle = left ? s.angle + angleChange : s.angle - angleChange;
  if (angle < 0) {
    angle += 2 * Math.PI;
  } else if (angle > 2 * Math.PI) {
    angle -= 2 * Math.PI;
  }
  return line(midway.x, midway.y, angle, s.magnitude * 0.7);
}

function initialPlant() {
  return [
    line(0.5, 1, Math.PI * 1.5, 0.2),
  ];
}

function newStems(plant) {
  var stems = [];
  plant.forEach(function (s) {
    stems.push(nextStem(s, 1, 4, false));
    stems.push(nextStem(s, 2, 4, true));
    stems.push(nextStem(s, 3, 4, false));
    stems.push(nextStem(s, 4, 4, true));
  });
  return stems;
}


function makePlant(iters) {
  var plant = newestStems = initialPlant();
  while (iters--) {
    newestStems = newStems(newestStems);
    newestStems.forEach(function (s) {
      plant.push(s);
    })
  }
  return plant;
}

//////////////////////////////////////////////////
// drawing

function drawLines(canvas, lines) {
  var context = canvas.getContext('2d'),
      width = canvas.width,
      height = canvas.height;
  context.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach(function (line) {
    var end = getLineEnd(line),
        x1 = Math.floor(line.x * width),
        y1 = Math.floor(line.y * height),
        x2 = Math.floor(end.x * width),
        y2 = Math.floor(end.y * height);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  });
}

window.onload = function () {
  var canvas = document.getElementById('canvas'),
      plant = initialPlant(),
      newestStems = plant;
  canvas.width = 700;
  canvas.height = 700;

  canvas.onclick = function () {
    newestStems = newStems(newestStems);
    newestStems.forEach(function (s) {
      plant.push(s);
    })
    drawLines(canvas, plant);
  }
};
