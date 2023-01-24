"use strict";

// math

function textHeight(context, text) {
  const metrics = context.measureText(text);
  return metrics.actualBoundingBoxAscent;
}

function sum(xs) {
  return xs.reduce((x, y) => x + y, 0);
}

function lineWidthOf(canvasHeight) {
  return Math.max(Math.round(canvasHeight / 250), 1);
}

function getScaledValue(value, rect, canvas) {
  return (canvas.width / rect.width) * value;
}

function getScaledPoint(clientX, clientY, rect, canvas) {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const scaledX = getScaledValue(x, rect, canvas);
  const scaledY = getScaledValue(y, rect, canvas);

  return { x: scaledX, y: scaledY };
}

function cmaRound(c, m, a) {
  // make up the difference in the a measurement
  const roundedC = Math.round(c * 100);
  const roundedM = Math.round(m * 100);
  return {
    c: roundedC,
    m: roundedM,
    a: 100 - roundedC * 2 - roundedM * 2,
  };
}

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
    return 0;
  }
  if (dot2.y == dot1.y) {
    return Infinity;
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

    const cAverage = (c1 + c2) / 2;
    const mAverage = (m1 + m2) / 2;

    const cPart = (c1 + c2) / 2 / diameter;
    const mPart = (m1 + m2) / 2 / diameter;
    const aPart = a / diameter;
    return {
      c: cPart,
      m: mPart,
      a: aPart,
      c1Pixels: c1,
      m1Pixels: m1,
      m2Pixels: m2,
      c2Pixels: c2,
      cPixelsAverage: cAverage,
      mPixelsAverage: mAverage,
      aPixels: a,
      diameter,
    };
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
  if (dots.some((dot) => dot.x === x && dot.y === y)) {
    return dots;
  }

  if (dots.length <= 1) {
    return [...dots, { x, y }];
  }

  const [dot1, dot2] = dots;

  return [...dots, dotLocationOnSlope(dot1, dot2, x, y)];
}

// undo stack

class UndoStack {
  constructor({ stack, index }) {
    this.stack = stack;
    this.index = index;
  }

  pushState(state) {
    const { stack, index } = this;
    return new UndoStack({
      stack: [...stack.slice(0, index + 1), state],
      index: index + 1,
    });
  }

  getState() {
    return this.stack[this.index];
  }

  redo() {
    const { stack, index } = this;
    return new UndoStack({
      stack,
      index: Math.min(stack.length - 1, index + 1),
    });
  }

  undo() {
    const { stack, index } = this;
    return new UndoStack({ stack, index: Math.max(0, index - 1) });
  }

  hasRedo() {
    return this.index < this.stack.length - 1;
  }

  hasUndo() {
    return this.index > 0;
  }
}

// rendering

function renderDiameter(diameter) {
  return diameter ? `Diameter = ${Math.round(diameter)}px` : "";
}

function renderDot(context, x, y, perpendicularSlope) {
  const away = Math.max(Math.round(context.canvas.height / 25), 1);
  const dot = perpendicularAway({ x, y }, away, perpendicularSlope);

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(dot.x, dot.y);
  context.stroke();
}

function renderDotsOnCanvas(state, context) {
  let { dotsUndoStack, mode } = state;
  let dots = dotsUndoStack.getState();
  if (dots.length === 0) {
    return;
  }

  if (dots.length === 1) {
    context.beginPath();
    context.fillStyle = "black";
    context.moveTo(dots[0].x, dots[0].y);
    context.arc(dots[0].x, dots[0].y, 3, 0, 2 * Math.PI);
    context.fill();
    return;
  }

  const perpendicularSlope = perpendicularSlopeOf(dots[0], dots[1]);

  dots = [...dots];
  dots.sort((dot1, dot2) => dot1.y - dot2.y);

  dots.forEach(({ x, y }) => {
    renderDot(context, x, y, perpendicularSlope);
  });

  if (dots.length) {
    drawBar(context, dots[0], dots[dots.length - 1]);
  }
}

function cmaTextOf(state) {
  const cma = calculateCMA(state.dotsUndoStack.getState());
  if (cma) {
    const { c, m, a } = cma;
    const rounded = cmaRound(c, m, a);
    return `CMA = ${rounded.c} / ${rounded.m} / ${rounded.a}`;
  }
}

//lower by 14
function renderLabel(state, context) {
  const cmaText = cmaTextOf(state);
  const fontSizePx = Math.round(
    Math.max(context.canvas.height, context.canvas.width) / 30
  );
  context.font = `${fontSizePx}px Arial`;

  const includeCMA = state.labelIncludeCMA && cmaText;
  const lines = (state.label ? 1 : 0) + (includeCMA ? 1 : 0);

  if (!lines) {
    return;
  }

  const textLines = [];

  if (state.label) {
    textLines.push(state.label);
  }

  if (state.labelIncludeCMA && cmaText) {
    textLines.push(cmaText);
  }

  const textWidth = Math.max(
    0,
    context.measureText(state.label).width,
    includeCMA ? context.measureText(cmaText).width : 0
  );

  const lineSpacing = fontSizePx * 0.4;
  const margin = fontSizePx * 0.4;

  const xOuterStart = fontSizePx * 0.3;
  const yOuterStart = xOuterStart;

  const xInnerStart = xOuterStart + margin;
  const yInnerStart = yOuterStart + margin;

  const xInnerEnd = xInnerStart + textWidth;
  const yInnerEnd =
    yInnerStart +
    sum(textLines.map((line) => textHeight(context, line) + lineSpacing)) -
    lineSpacing;

  const xOuterEnd = xInnerEnd + margin;
  const yOuterEnd = yInnerEnd + margin;

  const height = fontSizePx * 1.5 * lines;

  context.beginPath();
  context.fillStyle = "black";
  context.rect(
    xOuterStart,
    yOuterStart,
    xOuterEnd - xOuterStart,
    yOuterEnd - yOuterStart
  );
  context.fill();

  context.fillStyle = "white";

  let textY = yInnerStart;
  textLines.forEach((line) => {
    textY += textHeight(context, line);
    context.beginPath();
    context.fillText(line, xInnerStart, textY);
    textY += lineSpacing;
  });
}

function renderCanvas(state, context) {
  if (state.fileLoaded) {
    renderLabel(state, context);
    renderDotsOnCanvas(state, context);
  } else {
    context.font = "20px Arial";
    const text = "Click to upload photo";
    const textWidth = context.measureText(text).width;
    context.fillText(
      text,
      context.canvas.width / 2 - textWidth / 2,
      context.canvas.height / 2
    );
  }
}

function element(name, children, attributes) {
  const element = document.createElement(name);
  (children || []).forEach((child) => {
    if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(child.toString()));
    } else {
      element.appendChild(child);
    }
  });
  Object.entries(attributes || {}).map(([key, value]) => {
    element[key] = value;
  });
  return element;
}

function pixels(n) {
  return `${Math.round(n)}px`;
}

function percent(n) {
  return `${Math.round(n * 100)}`;
}

function renderCMABreakdown(state) {
  const dots = state.dotsUndoStack.getState();
  const cma = calculateCMA(dots);
  if (cma) {
    const rounded = cmaRound(cma.c, cma.m, cma.a);
    return element("div", [
      element("table", [
        element("thead", [
          element("th", [""]),
          element("th", ["Raw"]),
          element("th", ["Average"]),
          element("th", ["%"]),
        ]),
        element("tbody", [
          element("tr", [
            element("td", ["C"], { className: "table-row-label" }),
            element("td", [pixels(cma.c1Pixels)], {
              className: "table-number-cell",
            }),
            element("td", [pixels(cma.cPixelsAverage)], {
              className: "table-number-cell",
            }),
            element("td", [rounded.c], { className: "table-number-cell" }),
          ]),
          element("tr", [
            element("td", ["M"], { className: "table-row-label" }),
            element("td", [pixels(cma.m1Pixels)], {
              className: "table-number-cell",
            }),
            element("td", [pixels(cma.mPixelsAverage)], {
              className: "table-number-cell",
            }),
            element("td", [rounded.m], { className: "table-number-cell" }),
          ]),
          element("tr", [
            element("td", ["A"], { className: "table-row-label" }),
            element("td", [pixels(cma.aPixels)], {
              className: "table-number-cell",
            }),
            element("td", [pixels(cma.aPixels)], {
              className: "table-number-cell",
            }),
            element("td", [rounded.a], { className: "table-number-cell" }),
          ]),
          element("tr", [
            element("td", ["M"], { className: "table-row-label" }),
            element("td", [pixels(cma.m2Pixels)], {
              className: "table-number-cell",
            }),
          ]),
          element("tr", [
            element("td", ["C"], { className: "table-row-label" }),
            element("td", [pixels(cma.c2Pixels)], {
              className: "table-number-cell",
            }),
          ]),
          element("tr", [
            element("td", ["Total"], { className: "table-row-label" }),
            element("td", [pixels(cma.diameter)], {
              className: "table-number-cell",
            }),
          ]),
        ]),
      ]),
      element("em", [
        "Final axis value is calculated as 100 - C*2 - M*2 to adjust for rounding errors.",
      ]),
    ]);
  } else {
    return null;
  }
}

function render({ state, setMode }) {
  const canvas = document.getElementById("drawing-canvas");
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = lineWidthOf(context.canvas.height);

  renderCanvas(state, context);

  const cmaText = cmaTextOf(state);
  if (cmaText) {
    document.getElementById("cma-display").innerHTML = cmaText;
    document.getElementById("toggle-show-breakdown-button").style.display =
      "inline";
  } else {
    document.getElementById("cma-display").innerHTML = "";
    document.getElementById("toggle-show-breakdown-button").style.display =
      "none";
  }

  document.getElementById("cma-calculation-breakdown").innerHTML = "";
  const breakdown = renderCMABreakdown(state);
  if (breakdown && state.showBreakdown) {
    document.getElementById("cma-calculation-breakdown").appendChild(breakdown);
  }

  document.getElementById("diameter-display").innerHTML = renderDiameter(
    diameterOf(state.dotsUndoStack.getState())
  );
  document.getElementById("label-input").value = state.label;
  document.getElementById("clear-dots").disabled = !state.fileLoaded;
  document.getElementById("download-canvas").disabled = !state.fileLoaded;
  document.getElementById("input-include-cma").checked = state.labelIncludeCMA;

  document.getElementById("measurement-undo").disabled =
    !state.dotsUndoStack.hasUndo();
  document.getElementById("measurement-redo").disabled =
    !state.dotsUndoStack.hasRedo();
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
      drawingCanvas.width = img.width;
      drawingCanvas.height = img.height;
      imageCanvas.width = img.width;
      imageCanvas.height = img.height;

      context.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);

      // clear this so if the user reuploads the same image this event will fire again
      document.getElementById("image-input").value = "";

      fileLoaded(file.name.replace(/\.[^\.]+$/, ""));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function downloadCanvas(state, imageCanvas, drawingCanvas) {
  const flattenedCanvas = document.createElement("canvas");
  flattenedCanvas.height = imageCanvas.height;
  flattenedCanvas.width = imageCanvas.width;
  const flattenedCanvasContex = flattenedCanvas.getContext("2d");
  flattenedCanvasContex.drawImage(imageCanvas, 0, 0);
  flattenedCanvasContex.drawImage(drawingCanvas, 0, 0);

  const link = document.createElement("a");

  const now = new Date();
  const timestamp = now.toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const filename =
    (state.label ? state.label + " " : "") +
    "CMA measurement" +
    (state.label ? "" : " " + timestamp) +
    ".png";

  link.download = filename;
  link.href = flattenedCanvas.toDataURL();
  link.click();
}

function drawBar(context, dotFrom, dotTo) {
  const lineWidth = lineWidthOf(context.canvas.height);
  const perpendicularSlope = perpendicularSlopeOf(dotFrom, dotTo);

  // adjust long bar to fit perpendicular bars snugly
  const adjustedFrom = perpendicularAway(
    dotFrom,
    lineWidth / 2,
    perpendicularSlope
  );
  const adjustedTo = perpendicularAway(
    dotTo,
    lineWidth / 2,
    perpendicularSlope
  );

  context.beginPath();
  context.moveTo(adjustedFrom.x, adjustedFrom.y);
  context.lineTo(adjustedTo.x, adjustedTo.y);
  context.stroke();
}

function drawGuide(state, canvas, x, y) {
  const { mode, mouseLocation } = state;
  const dots = state.dotsUndoStack.getState();
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  renderCanvas(state, context);

  if (mouseLocation === "out") {
    return;
  }

  if (dots.length === 1) {
    const [dot] = dots;
    drawBar(context, dot, { x, y });

    const perpendicularSlope = perpendicularSlopeOf(dot, { x, y });
    renderDot(context, x, y, perpendicularSlope);
    renderDot(context, dot.x, dot.y, perpendicularSlope);

    document.getElementById("diameter-display").innerHTML = renderDiameter(
      distanceBetween(dot, { x, y })
    );
  } else if (dots.length > 1 && dots.length < 6) {
    const dotOnSlope = dotLocationOnSlope(dots[0], dots[1], x, y);
    const perpendicularSlope = perpendicularSlopeOf(dots[0], dots[1]);
    renderDot(context, dotOnSlope.x, dotOnSlope.y, perpendicularSlope);
  }
}

// state

function drawingState() {
  let state = {
    dotsUndoStack: new UndoStack({ stack: [[]], index: 0 }),
    mode: "Measure",
    mouseLocation: "out",
    labelIncludeCMA: true,
    label: "",
    fileLoaded: false,
    showBreakdown: false,
  };

  function setDotsState(dots) {
    if (dots.length <= 6) {
      setState({
        dotsUndoStack: state.dotsUndoStack.pushState(dots),
      });
    }
  }

  function addDotToState(x, y) {
    const dots = state.dotsUndoStack.getState();
    return setDotsState(addDot(dots, x, y));
  }

  function clickCanvas(x, y) {
    if (!state.fileLoaded) {
      document.getElementById("image-input").click();
      return;
    }
    if (state.mode === "Measure") {
      addDotToState(x, y);
      return;
    }
  }

  function clearDots() {
    if (state.dotsUndoStack.getState().length > 0) {
      setDotsState([]);
    }
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
    const label = state.fileLoaded ? filename : state.label || filename;
    setState({
      fileLoaded: true,
      label,
      dotsUndoStack: new UndoStack({ stack: [[]], index: 0 }),
    });
  }

  function changeLabel(label) {
    setState({ label });
  }

  function changeIncludeCMA(labelIncludeCMA) {
    setState({ labelIncludeCMA });
  }

  function toggleShowBreakdown() {
    setState({ showBreakdown: !state.showBreakdown });
  }

  window.getState = getState;

  return {
    getState,
    undoDots: () => setState({ dotsUndoStack: state.dotsUndoStack.undo() }),
    redoDots: () => setState({ dotsUndoStack: state.dotsUndoStack.redo() }),
    clickCanvas,
    clearDots,
    mouseMove,
    mouseOut,
    render: renderWithState,
    fileLoaded,
    changeLabel,
    changeIncludeCMA,
    toggleShowBreakdown,
  };
}

// initialization
window.onload = function () {
  const {
    getState,
    clickCanvas,
    clearDots,
    mouseMove,
    render,
    mouseOut,
    fileLoaded,
    changeLabel,
    changeIncludeCMA,
    redoDots,
    undoDots,
    toggleShowBreakdown,
  } = drawingState();

  const imageCanvas = document.getElementById("image-canvas");

  const drawingCanvas = document.getElementById("drawing-canvas");

  drawingCanvas.addEventListener(
    "mousedown",
    function (event) {
      const rect = drawingCanvas.getBoundingClientRect();
      const { x, y } = getScaledPoint(
        event.clientX,
        event.clientY,
        rect,
        drawingCanvas
      );
      clickCanvas(x, y);
    },
    false
  );

  drawingCanvas.addEventListener("mouseout", () => mouseOut());

  drawingCanvas.addEventListener("mousemove", function (event) {
    const rect = drawingCanvas.getBoundingClientRect();
    const { x, y } = getScaledPoint(
      event.clientX,
      event.clientY,
      rect,
      drawingCanvas
    );
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
      () => downloadCanvas(getState(), imageCanvas, drawingCanvas),
      false
    );

  document
    .getElementById("measurement-undo")
    .addEventListener("click", undoDots, false);

  document
    .getElementById("measurement-redo")
    .addEventListener("click", redoDots, false);

  document
    .getElementById("clear-dots")
    .addEventListener("click", clearDots, false);

  document.getElementById("label-input").oninput = (event) => {
    changeLabel(event.target.value);
  };

  document.getElementById("input-include-cma").onchange = (event) => {
    changeIncludeCMA(event.target.checked);
  };

  document.getElementById("toggle-show-breakdown-button").onclick = () => {
    toggleShowBreakdown();
  };

  document.onkeydown = (event) => {
    if (event.keyCode == "Z".charCodeAt(0) && event.ctrlKey) {
      undoDots();
    }
    if (event.keyCode == "Y".charCodeAt(0) && event.ctrlKey) {
      redoDots();
    }
    if (event.keyCode == "N".charCodeAt(0) && event.ctrlKey) {
      document.getElementById("image-input").click();
    }
  };

  render();
};
