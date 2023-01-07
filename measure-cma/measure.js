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

function render(state) {
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
}

// canvas manipulation and loading

function loadImage(e) {
  const canvas = document.getElementById("image-canvas");
  const ctx = canvas.getContext("2d");

  var reader = new FileReader();
  reader.onload = function (event) {
    var img = new Image();
    img.onload = function () {
      // load image, preserving aspect ratio but resizing
      const maxHeight = canvas.height;
      const maxWidth = canvas.width;

      if (img.height > img.width) {
        // scale down height to fit
        const dHeight = maxHeight;
        const dWidth = img.width * (maxHeight / img.height);
        ctx.drawImage(img, 0, 0, dWidth, dHeight);
      } else {
        // scale down width to fit
        const dWidth = maxWidth;
        const dHeight = img.height * (maxWidth / img.width);
        ctx.drawImage(img, 0, 0, dWidth, dHeight);
      }
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

// state

function drawingState() {
  let state = {
    dots: [],
  };

  function setState(newState) {
    state = { ...state, ...newState };
    render(state);
  }

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

  function clearDots() {
    setState({ dots: [] });
  }

  return {
    state,
    addDot,
    clearDots,
  };
}

// initialization
window.onload = function () {
  const { state, addDot, clearDots } = drawingState();

  const imageCanvas = document.getElementById("image-canvas");

  const drawingCanvas = document.getElementById("drawing-canvas");

  drawingCanvas.addEventListener(
    "mousedown",
    function (event) {
      const rect = drawingCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      addDot(x, y);
    },
    false
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
};
