// calculations

function calculateCMA(dots) {
  if (dots.length == 6) {
    const ys = dots.map((dot) => dot.y);
    ys.sort((a, b) => a - b);
    const first = ys[0];
    const rest = ys.slice(1);
    const diffs = rest.map((y, i) => y - (i === 0 ? first : rest[i - 1]));
    const [c1, m1, a, m2, c2] = diffs;
    const diameter = ys[ys.length - 1] - ys[0];
    const cPart = (c1 + c2) / 2 / diameter;
    const mPart = (m1 + m2) / 2 / diameter;
    const aPart = a / diameter;
    return { c: cPart, m: mPart, a: aPart };
  } else {
    return null;
  }
}

// rendering

function renderDotsOnCanvas(dots, context) {
  dots = [...dots];
  dots.sort((dot1, dot2) => dot1.y - dot2.y);

  dots.forEach(({ x, y }) => {
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 30, y);
    context.stroke();
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

  const controls = [
    "Align", "Measure",
  ].map(mode => {
    const button = document.createElement("span");
    button.innerHTML = mode;
    button.onclick = () => {
      setMode(mode);
    }
    button.style.border = 'solid thin';
    if (mode === state.mode) {
      button.style.color = 'white';
      button.style.backgroundColor = 'black';
    }
    button.style.cursor = 'pointer';
    return button;
  });
  const controlsContainer = document.getElementById("controls");
  controlsContainer.innerHTML = '';
  controls.forEach(control => controlsContainer.appendChild(control));
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
      const maxHeight = 500;
      const maxWidth = 500;

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
      imageCanvas.getContext("2d").drawImage(img, 0, 0, dWidth, dHeight);
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

function rotateCanvasImageByLine(x1, y1, x2, y2) {
  console.log(x1, y1, x2, y2);

  const canvas = document.getElementById('image-canvas');
  const context = canvas.getContext("2d");

  var tempCanvas = document.createElement("canvas"),
      tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

  const angle = (y2 - y1) / (x2 - x1)
  console.log(angle);
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.translate((canvas.width / 2), (canvas.height / 2));
  context.rotate(angle);
  context.translate(-(canvas.width / 2), -(canvas.height / 2));
  context.drawImage(tempCanvas, 0, 0);
  context.restore();
}

// state

function drawingState() {
  let state = {
    dots: [],
    mode: "Align",
    alignStart: null,
  };

  function addDot(x, y) {
    const { dots } = state;
    if (dots.length === 6) {
      // do nothing
    } else if (dots.length > 0) {
      const dot = dots[0];
      // use dot[0]'s x, set y
      setState({ dots: [...dots, { x: dot.x, y }] });
    } else {
      setState({ dots: [{ x, y }] });
    }
  }

  function clickCanvas(x, y) {
    if (state.mode === 'Align') {
      if (state.alignStart !== null) {
	rotateCanvasImageByLine(state.alignStart.x, state.alignStart.y, x, y);
	setState({ alignStart: null });
      } else {
	setState({ alignStart: {x, y} });
      }
    } else if (state.mode === 'Measure') {
      addDot(x, y);
    }
  }

  function clearDots() {
    setState({ dots: [] });
  }

  function setMode(mode) {
    setState({ mode, alignStart: null });
  }

  function renderWithState() {
    render(({ state, setMode }));
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
    render: renderWithState,
  };
}

function drawAlign(canvas, dots, alignStart, x, y) {
  if (!alignStart) return;

  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  renderDotsOnCanvas(dots, context);

  context.beginPath();
  context.moveTo(alignStart.x, alignStart.y);
  context.lineTo(x, y);
  context.stroke();
}

// initialization
window.onload = function () {
  const { getState, clickCanvas, clearDots, render } = drawingState();

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

  drawingCanvas.addEventListener(
    "mousemove",
    function (event) {
      const rect = drawingCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const state = getState();
      drawAlign(drawingCanvas, state.dots, state.alignStart, x, y)
    }
  );

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
