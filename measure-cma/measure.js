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
  if (dots && dots.length == 6) {
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

function renderDiameter(diameter) {
  return diameter
    ? `Diameter = ${Math.round(diameter)}px`
    : "";
}

function renderDot(context, x, y, perpendicularSlope) {
  const dot = perpendicularAway({ x, y }, 30, perpendicularSlope);

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(dot.x, dot.y);
  context.stroke();
}

function renderDotsOnCanvas(state, context) {
  const { dots, mode } = state;
  if (dots.length === 0) {
    return;
  }

  if (dots.length === 1) {
    if (state.mouseLocation === 'out') {
      context.moveTo(dots[0].x, dots[0].y);
      context.arc(dots[0].x, dots[0].y, 5, 0, 2 * Math.PI);
      context.fill();
    }
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

function cmaTextOf(state) {
  const cma = calculateCMA(state.dots);
  if (cma) {
    const { c, m, a } = cma;
    const cPercent = Math.round(c * 100);
    const mPercent = Math.round(m * 100);
    const aPercent = Math.round(a * 100);
    return `CMA = ${cPercent} / ${mPercent} / ${aPercent}`;
  }
}

function renderLabel(state, context) {
  const cmaText = cmaTextOf(state);
  context.font = "20px Arial";

  const yStart = 30;

  const includeCMA = state.labelIncludeCMA && cmaText;
  const lines = (state.label ? 1 : 0) + (includeCMA ? 1 : 0);

  if (!lines) {
    return;
  }

  const width = Math.max(
    0,
    context.measureText(state.label).width,
    includeCMA ? context.measureText(cmaText).width : 0,
  )

  const height = 30 * lines;

  context.fillStyle = "black";
  context.rect(25, yStart - 20, width + 10, height);
  context.fill();

  context.fillStyle = "white";
  y = yStart;
  if (state.label) {
    context.fillText(state.label, 30, y);
    y += 30;
  }
  if (state.labelIncludeCMA && cmaText) {
    context.fillText(cmaText, 30, y);
  }
}

function renderCanvas(state, context) {
  renderLabel(state, context)
  renderDotsOnCanvas(state, context);
}

function render({ state, setMode }) {
  const canvas = document.getElementById("drawing-canvas");
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = 2;

  renderCanvas(state, context);

  const cmaText = cmaTextOf(state);
  if (cmaText) {
    document.getElementById(
      "cma-display"
    ).innerHTML = cmaText;
  } else {
    document.getElementById("cma-display").innerHTML = "";
  }

  document.getElementById("diameter-display").innerHTML = renderDiameter(diameterOf(state.dots));
  document.getElementById("label-input").value = state.label;
  document.getElementById("clear-dots").disabled = !state.fileLoaded;
  document.getElementById("reset-image").disabled = !state.fileLoaded;
  document.getElementById("download-canvas").disabled = !state.fileLoaded;
  console.log(state.labelIncludeCMA);
  document.getElementById("input-include-cma").checked = state.labelIncludeCMA;
}

// canvas manipulation and loading

function loadImage(e, fileLoaded) {
  const imageCanvas = document.getElementById("image-canvas");
  const drawingCanvas = document.getElementById("drawing-canvas");
  const context = imageCanvas.getContext("2d");
  context.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

  var reader = new FileReader();

  const [file] = e.target.files;

  reader.onload = function (event) {
    var img = new Image();
    img.onload = function () {
      // load image, preserving aspect ratio but resizing
      const maxHeight = 700;
      const maxWidth = 700;

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

      fileLoaded(file.name.replace(/\.[^\.]+$/, ''));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
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

function drawGuide(state, canvas, x, y) {
  const { mode, mouseLocation, dots } = state;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  renderCanvas(state, context);

  if (mouseLocation === "out") {
    return;
  }

  if (dots.length === 1) {
    const [dot] = dots;
    context.beginPath();
    context.moveTo(dot.x, dot.y);
    context.lineTo(x, y);
    context.stroke();

    const perpendicularSlope = perpendicularSlopeOf(dot, {x, y});
    renderDot(context, x, y, perpendicularSlope);
    renderDot(context, dot.x, dot.y, perpendicularSlope);

    document.getElementById("diameter-display").innerHTML =
      renderDiameter(distanceBetween(dot, { x, y }));

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
    labelIncludeCMA: true,
    label: "",
    fileLoaded: false,
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

  function fileLoaded(filename) {
    setState({ fileLoaded: true, label: filename });
  }

  function changeLabel(label) {
    setState({ label });
  }

  function changeIncludeCMA(labelIncludeCMA) {
    setState({ labelIncludeCMA });
  }

  return {
    getState,
    clickCanvas,
    clearDots,
    mouseMove,
    mouseOut,
    render: renderWithState,
    fileLoaded,
    changeLabel,
    changeIncludeCMA,
  };
}

function resetPage() {
  ["image-canvas", "drawing-canvas"].forEach(cname => {
    const canvas = document.getElementById(cname);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  });
}

// initialization
window.onload = function () {
  const { getState, clickCanvas, clearDots, mouseMove, render, mouseOut, fileLoaded, changeLabel, changeIncludeCMA } =
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
    drawGuide(state, drawingCanvas, x, y);
  });

  document
    .getElementById("image-input")
    .addEventListener("change", (e) => loadImage(e, fileLoaded));

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

  document.getElementById("reset-image").addEventListener("click", () => {
    if (window.confirm("This will clear your measurements as well as the image. Are you sure?")) {
    clearDots();
    resetPage();
    }
  }, false);

  document.getElementById("label-input").oninput = event => {
    changeLabel(event.target.value);
  }


  document.getElementById("input-include-cma").onchange = event => {
    changeIncludeCMA(event.target.checked);
  }

  render();
};
