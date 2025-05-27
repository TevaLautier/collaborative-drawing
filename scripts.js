const brushSizeInput = document.getElementById("brush-size");
const colorPicker = document.getElementById("color-picker");

const brushes = document.querySelectorAll(".brusch");
brushes.forEach((brush) => {
  brush.addEventListener("click", () => {
    brushSizeInput.value = brush.dataset.size;
  });
});
const canvas = document.getElementById("drawing-board");
const context = canvas.getContext("2d");
let img2 = new Image();
img2.src = "images/drawing.png";
setTimeout(() => {
  context.drawImage(img2, 0, 0);
}, 1000);
const userIdDisplay = document.getElementById("user-id-display");

const nbEcran = 2;
const width = 1024 * nbEcran;
const height = 768 * nbEcran;
canvas.width = width;
canvas.height = height;
document.body.style.height = height + "px";
document.body.style.width = width + "px";

function loadAnimation() {
  const img = document.getElementById("floating-image");
  img.src = "animation/1.gif";
  img.onload = () => {
   img.style.display = "block";
   img.style.position = "fixed";
    img.style.top = Math.random() * (window.innerHeight - img.height) + "px";
    img.style.left = Math.random() * (window.innerWidth - img.width) + "px";
    img.style.zIndex = "1000"; // Ensure the image is on top
    setTimeout(() => {
      img.style.display = "none";
    }, 5000); // Hide the image after 5 seconds
  };
}

setInterval(() => {
  loadAnimation();
}, 10000); // Load animation every 10 seconds

userIdDisplay.textContent = `User${Math.floor(Math.random() * 100) + 1}`;

colorPicker.value = (function getRandomColor() {
  return (
    "#" +
    Array.from(
      { length: 6 },
      () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]
    ).join("")
  );
})();

let drawing = false;
let previousPosition;

canvas.addEventListener("mousedown", (e) => {
  e.preventDefault();
  drawing = true;
  console.log(
    e.clientY + " " + e.pageY + " " + canvas.offsetLeft + " " + window.scrollY
  );
  previousPosition = {
    x: e.pageX - canvas.offsetLeft,
    y: e.pageY - canvas.offsetTop,
  };

  context.beginPath();
  context.moveTo(previousPosition.x, previousPosition.y);

  // Emit the 'startDrawing' event
  socket.emit("start-drawing", previousPosition);
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;

  const currentPosition = {
    x: e.pageX - canvas.offsetLeft,
    y: e.pageY - canvas.offsetTop,
  };

  const data = {
    fp: previousPosition,
    tp: currentPosition,
    c: colorPicker.value,
    bs: brushSizeInput.value,
  };

  drawLine(data.fp, data.tp, data.c, data.bs);

  // Send the drawing data to the server
  socket.emit("drawing-data", data);

  // Update previousX and previousY
  previousPosition = currentPosition;
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});

const socket = io.connect();

socket.on("drawing-data", (data) => {
  drawLine(data.fp, data.tp, data.c, data.bs);
});

socket.on("start-drawing", (data) => {
  context.beginPath();
  context.moveTo(data.x, data.y);
});

function drawLine(from, to, color, brushSize) {
  context.strokeStyle = color;
  context.lineWidth = brushSize;
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
}
