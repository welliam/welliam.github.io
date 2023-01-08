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
  if (dots.length <= 1) {
    return [...dots, { x, y }];
  }

  if (dots.length === 6) {
    return dots;
  }

  const [dot1, dot2] = dots;

  return [...dots, dotLocationOnSlope(dot1, dot2, x, y)];
}

// undo stack

function undoStackPushState(undoStack, state) {
  const { stack, index } = undoStack;
  return { stack: [...stack.slice(0, index + 1), state], index: index + 1 };
}

function undoStackGetState(undoStack) {
  return undoStack.stack[undoStack.index];
}

function undoStackRedo(undoStack) {
  const { stack, index } = undoStack;
  return { stack, index: Math.min(stack.length - 1, index + 1) };
}

function undoStackUndo(undoStack) {
  const { stack, index } = undoStack;
  return { stack, index: Math.max(0, index - 1) };
}

function undoStackHasRedo(undoStack) {
  return undoStack.index < undoStack.stack.length - 1;
}

function undoStackHasUndo(undoStack) {
  return undoStack.index > 0;
}

// rendering

function renderDiameter(diameter) {
  return diameter ? `Diameter = ${Math.round(diameter)}px` : "";
}

function renderDot(context, x, y, perpendicularSlope) {
  const dot = perpendicularAway({ x, y }, 30, perpendicularSlope);

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(dot.x, dot.y);
  context.stroke();
}

function renderDotsOnCanvas(state, context) {
  let { dotsUndoStack, mode } = state;
  let dots = undoStackGetState(dotsUndoStack);
  if (dots.length === 0) {
    return;
  }

  if (dots.length === 1) {
    if (state.mouseLocation === "out") {
      context.beginPath();
      context.fillStyle = "black";
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
  const cma = calculateCMA(undoStackGetState(state.dotsUndoStack));
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
    includeCMA ? context.measureText(cmaText).width : 0
  );

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
  console.log(state);
  if (state.fileLoaded) {
    renderLabel(state, context);
    context.restore();
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
  const dots = undoStackGetState(state.dotsUndoStack);
  const cma = calculateCMA(dots);
  if (cma) {
    return element("table", [
      element("thead", [
        element("tr", [
          element("th", [""]),
          element("th", ["C"], { className: "table-number-cell" }),
          element("th", ["M"], { className: "table-number-cell" }),
          element("th", ["A"], { className: "table-number-cell" }),
        ]),
      ]),
      element("tbody", [
        element("tr", [
          element("td", [""]),
          element("td", [pixels(cma.c1Pixels)], {
            className: "table-number-cell",
          }),
          element("td", [pixels(cma.m1Pixels)], {
            className: "table-number-cell",
          }),
          element("td", [pixels(cma.aPixels)], {
            className: "table-number-cell",
          }),
        ]),
        element("tr", [
          element("td", [""]),
          element("td", [pixels(cma.c2Pixels)], {
            className: "table-number-cell",
          }),
          element("td", [pixels(cma.m2Pixels)], {
            className: "table-number-cell",
          }),
          element("td", [""]),
        ]),
        element("tr", [
          element("td", ["Average"]),
          element("td", [pixels(cma.cPixelsAverage)], {
            className: "table-number-cell",
          }),
          element("td", [pixels(cma.mPixelsAverage)], {
            className: "table-number-cell",
          }),
          element("td", [pixels(cma.aPixels)], {
            className: "table-number-cell",
          }),
        ]),
        element("tr", [
          element("td", ["% of diameter"]),
          element("td", [percent(cma.c)], { className: "table-number-cell" }),
          element("td", [percent(cma.m)], { className: "table-number-cell" }),
          element("td", [percent(cma.a)], { className: "table-number-cell" }),
        ]),
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
  context.lineWidth = 2;

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
    diameterOf(undoStackGetState(state.dotsUndoStack))
  );
  document.getElementById("label-input").value = state.label;
  document.getElementById("clear-dots").disabled = !state.fileLoaded;
  document.getElementById("reset-image").disabled = !state.fileLoaded;
  document.getElementById("download-canvas").disabled = !state.fileLoaded;
  document.getElementById("input-include-cma").checked = state.labelIncludeCMA;

  document.getElementById("measurement-undo").disabled = !undoStackHasUndo(
    state.dotsUndoStack
  );
  document.getElementById("measurement-redo").disabled = !undoStackHasRedo(
    state.dotsUndoStack
  );
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
      const maxHeight = 600;
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
  flattenedCanvasContex = flattenedCanvas.getContext("2d");
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

function drawGuide(state, canvas, x, y) {
  const { mode, mouseLocation } = state;
  const dots = undoStackGetState(state.dotsUndoStack);
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
    dotsUndoStack: { stack: [[]], index: 0 },
    mode: "Measure",
    mouseLocation: "out",
    labelIncludeCMA: true,
    label: "",
    fileLoaded: false,
    showBreakdown: false,
  };

  function resetPageState() {
    setState({
      fileLoaded: false,
      label: "",
      dotsUndoStack: { stack: [[]], index: 0 },
    });
  }

  function setDotsState(dots) {
    if (undoStackGetState(state.dotsUndoStack).length < 6) {
      setState({
        dotsUndoStack: undoStackPushState(state.dotsUndoStack, dots),
      });
    }
  }

  function addDotToState(x, y) {
    const dots = undoStackGetState(state.dotsUndoStack);
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
    setDotsState([]);
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
    setState({
      fileLoaded: true,
      label: state.label || filename,
      dotsUndoStack: { stack: [[]], index: 0 },
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

  return {
    getState,
    getDots: () => undoStackGetState(state.dotsUndoStack),
    undoDots: () =>
      setState({ dotsUndoStack: undoStackUndo(state.dotsUndoStack) }),
    redoDots: () =>
      setState({ dotsUndoStack: undoStackRedo(state.dotsUndoStack) }),
    clickCanvas,
    clearDots,
    mouseMove,
    mouseOut,
    render: renderWithState,
    fileLoaded,
    changeLabel,
    changeIncludeCMA,
    resetPageState,
    toggleShowBreakdown,
  };
}

function resetPage() {
  ["drawing-canvas", "image-canvas"].forEach((cname) => {
    const canvas = document.getElementById(cname);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 300;
    canvas.height = 150;
  });
}

// initialization
window.onload = function () {
  const {
    getState,
    getDots,
    clickCanvas,
    clearDots,
    resetPageState,
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

  document.getElementById("reset-image").addEventListener(
    "click",
    () => {
      if (
        window.confirm(
          "This will clear your measurements as well as the image. Are you sure?"
        )
      ) {
        resetPage();
        resetPageState();
      }
    },
    false
  );

  document.getElementById("label-input").oninput = (event) => {
    changeLabel(event.target.value);
  };

  document.getElementById("input-include-cma").onchange = (event) => {
    changeIncludeCMA(event.target.checked);
  };

  document.getElementById("what-is-this-button").onclick = () => {
    document.getElementById("what-is-this-modal").className = "modal";
  };

  document.getElementById("close-modal").onclick = () => {
    document.getElementById("what-is-this-modal").className = "hidden";
  };

  document.getElementById("toggle-show-breakdown-button").onclick = () => {
    toggleShowBreakdown();
  };

  document.onkeydown = (event) => {
    if (event.keyCode == 90 && event.ctrlKey) {
      undoDots();
    }
    if (event.keyCode == 89 && event.ctrlKey) {
      redoDots();
    }
  };

  render();
};
