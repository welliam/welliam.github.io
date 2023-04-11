function getCanvasContext() {
  const canvas = document.getElementById("game");
  return canvas.getContext('2d');
}

function drawUrl(url) {
  const img = new Image;
  img.src = url;

  const ctx = getCanvasContext();
  img.onload = function() {
    ctx.drawImage(img, 0, 0);
  }
}

const OUTFITS = [
  { url: './shirt.png' },
  { url: './pants.png' },
]

function drawUI() {
  const outfits = document.getElementById("outfits");
  OUTFITS.forEach(outfit => {
    const img = new Image;
    img.src = outfit.url;
    img.onclick = () => drawUrl(img.src);
    outfits.appendChild(img);
  });
}

window.onload = function () {
  getCanvasContext().canvas.width = 250;
  getCanvasContext().canvas.height = 250;

  drawUrl('./chunko.png');

  drawUI();
}
