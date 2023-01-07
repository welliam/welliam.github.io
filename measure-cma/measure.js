// math

function distanceBetween(dot1, dot2) {
  return Math.sqrt((dot2.x - dot1.x) ** 2 + (dot2.y - dot1.y) ** 2);
}

function sortDots(dots) {
  if (dots.length <= 1) {
    return [...dots];
  }
  return dots[0].y === dots[1].y
    ? [...dots].sort((dot1, dot2) => dot1.x - dot2.x)
    : [...dots].sort((dot1, dot2) => dot1.y - dot2.y);
}

function diameterOf(dots) {
  if (dots.length <= 1) {
    return null;
  }
  const sorted = sortDots(dots);
  return distanceBetween(sorted[0], sorted[sorted.length - 1]);
}

function perpendicularSlopeOf(dot1, dot2) {
  if (dot2.x == dot1.x) {
    // flat
    return Infinity;
  }
  if (dot2.y == dot1.y) {
    // infinite
    return 0;
  }
  const slope = (dot2.y - dot1.y) / (dot2.x - dot1.x);
  return 1 / -slope;
}

function perpendicularAway(dot, byAmount, perpendicularSlope) {
  if (perpendicularSlope == Infinity) {
    // special case-- flat line
    return { x: dot.x, y: dot.y - byAmount };
  }
  const angle = Math.atan(perpendicularSlope);
  const x = byAmount * Math.cos(angle);
  const y = byAmount * Math.sin(angle);
  return { x: x + dot.x, y: y + dot.y };
}

function calculateCMA(dots) {
  if (dots.length == 6) {
    const sorted = sortDots(dots);
    const diameter = diameterOf(dots);

    const first = sorted[0];
    const rest = sorted.slice(1);
    const diffs = rest.map((dot, i) =>
      distanceBetween(dot, i === 0 ? first : rest[i - 1])
    );
    const [c1, m1, a, m2, c2] = diffs;

    const cPart = (c1 + c2) / 2 / diameter;
    const mPart = (m1 + m2) / 2 / diameter;
    const aPart = a / diameter;
    return { c: cPart, m: mPart, a: aPart };
  } else {
    return null;
  }
}

function dotLocationOnSlope(dot1, dot2, x, y) {
  const line_slope = (dot2.y - dot1.y) / (dot2.x - dot1.x);

  if (line_slope === Infinity) {
    return { x: dot1.x, y };
  } else if (line_slope === 0) {
    return { x, y: dot1.y };
  } else {
    const line_c = dot1.y - line_slope * dot1.x;

    const dot_slope = -(1 / line_slope);
    const dot_c = y - dot_slope * x;

    const intersect_x = (line_c - dot_c) / (dot_slope - line_slope);
    const intersect_y = line_slope * intersect_x + line_c;

    return { x: intersect_x, y: intersect_y };
  }
}

function addDot(dots, x, y) {
  if (dots.length <= 1) {
    return [...dots, { x, y }];
  }

  if (dots.length === 6) {
    return dots;
  }

  const [dot1, dot2] = dots;

  return [...dots, dotLocationOnSlope(dot1, dot2, x, y)];
}

// rendering

function renderDot(context, x, y, perpendicularSlope) {
  const dot = perpendicularAway({ x, y }, 30, perpendicularSlope);

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(dot.x, dot.y);
  context.stroke();
}

function renderDotsOnCanvas(dots, context) {
  if (dots.length <= 1) {
    return;
  }

  const perpendicularSlope = perpendicularSlopeOf(dots[0], dots[1]);

  dots = [...dots];
  dots.sort((dot1, dot2) => dot1.y - dot2.y);

  dots.forEach(({ x, y }) => {
    renderDot(context, x, y, perpendicularSlope);
  });

  if (dots.length) {
    context.beginPath();
    context.moveTo(dots[0].x, dots[0].y);
    context.lineTo(dots[dots.length - 1].x, dots[dots.length - 1].y);
    context.stroke();
  }
}

function render({ state, setMode }) {
  const canvas = document.getElementById("drawing-canvas");
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = 2;

  renderDotsOnCanvas(state.dots, context);

  const cma = calculateCMA(state.dots);
  if (cma) {
    const { c, m, a } = cma;
    const cPercent = Math.round(c * 100);
    const mPercent = Math.round(m * 100);
    const aPercent = Math.round(a * 100);
    document.getElementById(
      "cma-display"
    ).innerHTML = `CMA = ${cPercent} / ${mPercent} / ${aPercent}`;
  } else {
    document.getElementById("cma-display").innerHTML = "";
  }

  const controls = ["Measure"].map((mode) => {
    const button = document.createElement("span");
    button.innerHTML = mode;
    button.onclick = () => {
      setMode(mode);
    };
    button.style.border = "solid thin";
    if (mode === state.mode) {
      button.style.color = "white";
      button.style.backgroundColor = "black";
    }
    button.style.cursor = "pointer";
    return button;
  });
  const controlsContainer = document.getElementById("controls");
  controlsContainer.innerHTML = "";
  controls.forEach((control) => controlsContainer.appendChild(control));
}

// canvas manipulation and loading

function loadImage(e) {
  const imageCanvas = document.getElementById("image-canvas");
  const drawingCanvas = document.getElementById("drawing-canvas");
  const context = imageCanvas.getContext("2d");
  context.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

  var reader = new FileReader();
  reader.onload = function (event) {
    var img = new Image();
    img.onload = function () {
      // load image, preserving aspect ratio but resizing
      const maxHeight = 1000;
      const maxWidth = 1000;

      let dHeight, dWidth;

      if (img.height > img.width) {
        // scale down height to fit
        dHeight = maxHeight;
        dWidth = img.width * (maxHeight / img.height);
      } else {
        // scale down width to fit
        dWidth = maxWidth;
        dHeight = img.height * (maxWidth / img.width);
      }
      drawingCanvas.height = dHeight;
      drawingCanvas.width = dWidth;
      imageCanvas.height = dHeight;
      imageCanvas.width = dWidth;
      context.drawImage(img, 0, 0, dWidth, dHeight);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
}

function downloadCanvas(imageCanvas, drawingCanvas) {
  const flattenedCanvas = document.createElement("canvas");
  flattenedCanvas.height = imageCanvas.height;
  flattenedCanvas.width = imageCanvas.width;
  flattenedCanvasContex = flattenedCanvas.getContext("2d");
  flattenedCanvasContex.drawImage(imageCanvas, 0, 0);
  flattenedCanvasContex.drawImage(drawingCanvas, 0, 0);

  var link = document.createElement("a");
  link.download = "filename.png";
  link.href = flattenedCanvas.toDataURL();
  link.click();
}

function drawGuide(canvas, mode, mouseLocation, dots, x, y) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  renderDotsOnCanvas(dots, context);

  if (mouseLocation === "out") {
    return;
  }

  if (dots.length === 1) {
    const [dot] = dots;
    context.beginPath();
    context.moveTo(dot.x, dot.y);
    context.lineTo(x, y);
    context.stroke();
  } else if (dots.length > 1 && dots.length < 6) {
    const dotOnSlope = dotLocationOnSlope(dots[0], dots[1], x, y);
    const perpendicularSlope = perpendicularSlopeOf(dots[0], dots[1]);
    renderDot(context, dotOnSlope.x, dotOnSlope.y, perpendicularSlope);
  }
}

// state

function drawingState() {
  let state = {
    dots: [],
    mode: "Measure",
    mouseLocation: "out",
  };

  function addDotToState(x, y) {
    return setState({ dots: addDot(state.dots, x, y) });
  }

  function clickCanvas(x, y) {
    if (state.mode === "Measure") {
      addDotToState(x, y);
    }
  }

  function clearDots() {
    setState({ dots: [] });
  }

  function setMode(mode) {
    setState({ mode });
  }

  function mouseMove() {
    setState({ mouseLocation: "in" });
  }

  function mouseOut() {
    setState({ mouseLocation: "out" });
  }

  function renderWithState() {
    render({ state, setMode });
  }

  function setState(newState) {
    state = { ...state, ...newState };
    renderWithState();
  }

  function getState() {
    return state;
  }

  return {
    getState,
    clickCanvas,
    clearDots,
    mouseMove,
    mouseOut,
    render: renderWithState,
  };
}

// initialization
window.onload = function () {
  const { getState, clickCanvas, clearDots, mouseMove, render, mouseOut } =
    drawingState();

  const imageCanvas = document.getElementById("image-canvas");

  const drawingCanvas = document.getElementById("drawing-canvas");

  drawingCanvas.addEventListener(
    "mousedown",
    function (event) {
      const rect = drawingCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      clickCanvas(x, y);
    },
    false
  );

  drawingCanvas.addEventListener("mouseout", () => mouseOut());

  drawingCanvas.addEventListener("mousemove", function (event) {
    const rect = drawingCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const state = getState();
    mouseMove();
    drawGuide(drawingCanvas, state.mode, state.mouseLocation, state.dots, x, y);
  });

  document
    .getElementById("image-input")
    .addEventListener("change", (e) => loadImage(e));

  document
    .getElementById("download-canvas")
    .addEventListener(
      "click",
      () => downloadCanvas(imageCanvas, drawingCanvas),
      false
    );

  document
    .getElementById("clear-dots")
    .addEventListener("click", clearDots, false);

  render();
};
