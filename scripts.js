const width = 3000;
const height = 2000;
const factor = 18;
const thumbnailWidth = width / factor;
const thumbnailHeight = height / factor;

REMOVE_THUMBNAIL_AFTER = 60 * 1000;
REFRESH_IMAGE_THUMBNAIL = 10 * 1000; // 10 seconds

// TODO placer aleatoirement dans l'ecran
const move = document.getElementById("move");
const brushSizeInput = document.getElementById("brush-size");
const colorPicker = document.getElementById("color-picker");
const thumbnail = document.getElementById("main-thumbnail");
const thumbImage = document.getElementById("thumbnail-image");

setInterval(() => {
  thumbImage.src = "images/drawing.png?" + new Date().getTime();
}, REFRESH_IMAGE_THUMBNAIL);

console.log(thumbnail);
thumbnail.style.width = thumbnailWidth + "px";
thumbnail.style.height = thumbnailHeight + "px";
let selectedTools = "pencil";
const animation = document.getElementById("animation");
animation.style.zIndex = "1001";

loadAnimation = () => {
  animation.style.display = "block";
};
setInterval(() => {
  thumbImage.src = "images/drawing.png?" + new Date().getTime();
}, REFRESH_IMAGE_THUMBNAIL);

selectToolEraser = (size) => {
  selectedTools = "eraser";
  clearToolSelection();
  document
    .querySelector('[data-tool="eraser"][data-size="' + size + '"]')
    .classList.add("selected");
  brushSizeInput.value = size;
};
selectToolBrush = (size) => {
  selectedTools = "pencil";
  clearToolSelection();
  document
    .querySelector('[data-tool="pencil"][data-size="' + size + '"]')
    .classList.add("selected");
  brushSizeInput.value = size;
};
selectToolMove = () => {
  selectedTools = "move";
  clearToolSelection();
  move.classList.add("selected");
};
initPreviousTool = () => {
  previousSelectedTool = {
    selectedTools,
    zoomFactor,
    size: brushSizeInput.value,
  };
};

const clearToolSelection = () => {
  const brushes = document.querySelectorAll(".brusch");
  brushes.forEach((brush) => {
    brush.classList.remove("selected");
  });
  move.classList.remove("selected");
  const gommmes = document.querySelectorAll(".gomme");
  gommmes.forEach((gommme) => {
    gommme.classList.remove("selected");
  });
};

move.addEventListener("click", () => {
  selectToolMove();
  initPreviousTool();
});
const brushes = document.querySelectorAll(".brusch");
brushes.forEach((brush) => {
  brush.addEventListener("click", () => {
    selectToolBrush(brush.dataset.size);
    initPreviousTool();
  });
});

const gommes = document.querySelectorAll(".gomme");
gommes.forEach((gomme) => {
  gomme.addEventListener("click", () => {
    selectToolEraser(gomme.dataset.size);
    initPreviousTool();
  });
});

const canvas = document.getElementById("drawing-board");
const context = canvas.getContext("2d");

let img2 = new Image();
img2.src = "images/drawing.png";
setTimeout(() => {
  context.drawImage(img2, 0, 0);
}, 200);
const userIdDisplay = document.getElementById("user-id-display");

const minZoom = 0.9;

canvas.width = width;
canvas.height = height;
document.body.style.height = height + "px";
document.body.style.width = width + "px";

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
userColor = colorPicker.value;

let drawing = false;

let previousPosition;

let lastCenter,
  pinchLastDist,
  startTranslate,
  pinchStartCenter,
  zoomOrigin = makePos(0, 0),
  zoomFactor = 1;

function makePos(x, y) {
  return {
    x: x,
    y: y,
  };
}

const ecran2canvas = (pos) => {
  return {
    x: pos.x / zoomFactor - zoomOrigin.x / zoomFactor,
    y: pos.y / zoomFactor - zoomOrigin.y / zoomFactor,
  };
};
const startMouvement = (e) => {
  if (e.preventDefault) e.preventDefault();
  drawing = true;
  previousPosition = ecran2canvas({
    x: e.pageX - canvas.offsetLeft,
    y: e.pageY - canvas.offsetTop,
  });
  startTranslate = zoomOrigin;
  context.beginPath();
  context.moveTo(previousPosition.x, previousPosition.y);

  // Emit the 'startDrawing' event
  socket.emit("start-drawing", previousPosition);
};
const emitEventScreen = () => {
  socket.emit("user-enter", createUserData());
  drawThumnail(
    "moi",
    userColor,
    zoomFactor,
    window.innerWidth,
    window.innerHeight,
    zoomOrigin.x,
    zoomOrigin.y
  );
};
const moveMouvement = (e) => {
  if (!drawing) return;
  let color, size, gco;
  console.log(selectedTools);
  if (selectedTools === "eraser") {
    color = "rgba(0,0,0,1) ";
    size = brushSizeInput.value;
    gco = "destination-out";
  } else if (selectedTools === "pencil") {
    color = colorPicker.value;
    size = brushSizeInput.value;
    gco = "source-over";
  } else if (selectedTools === "move") {
    const cpage = ecran2canvas({ x: e.pageX, y: e.pageY });
    emitEventScreen();
    setZoom(zoomFactor, {
      x: (cpage.x - previousPosition.x) * zoomFactor + startTranslate.x,
      y: (cpage.y - previousPosition.y) * zoomFactor + startTranslate.y,
    });

    return;
  }
  if (zoomFactor < minZoom) return;

  const currentPosition = ecran2canvas({
    x: e.pageX - canvas.offsetLeft,
    y: e.pageY - canvas.offsetTop,
  });

  const data = {
    fp: previousPosition,
    tp: currentPosition,
    c: color,
    bs: size,
    gco,
  };

  drawLine(data.fp, data.tp, data.c, data.bs, data.gco);

  // Send the drawing data to the server
  socket.emit("drawing-data", data);

  // Update previousX and previousY
  previousPosition = currentPosition;
};
const stopMouvmeent = (e) => {
  drawing = false;
  startTranslate = zoomOrigin;
  pinchLastDist = pinchStartCenter = 0;
  socket.emit("log", { zoomFactor });
};

checkAnimation = () => {
  console.log("checkAnimation", minZoom, zoomFactor);
  if (zoomFactor > minZoom) {
    animation.style.display = "none";
  } else {
    animation.style.display = "block";
  }
};
previousSelectedTool = {};
checkToolSelection = () => {
  const tmp = { selectedTools, zoomFactor, size: brushSizeInput.value };
  if (zoomFactor < minZoom) {
    selectToolMove();
  } else {
    if (previousSelectedTool.selectedTools === "pencil") {
      selectToolBrush(brushSizeInput.value);
    } else if (previousSelectedTool.selectedTools === "eraser") {
      selectToolEraser(brushSizeInput.value);
    }
  }
};
// setTimeout(() => {
//   zoom(1.1, makePos(100, 100));
// }, 2000);
// setTimeout(() => {
//   zoom(1.3, makePos(100 + zoomOrigin.x * 1.3, 100 + zoomOrigin.x * 1.3));
// }, 4000);

const setZoom = (newscale, orig) => {
  zoomOrigin = orig;
  zoomFactor = newscale;
  const t =
    "scale(" +
    newscale +
    ") translate(" +
    zoomOrigin.x / newscale +
    "px, " +
    zoomOrigin.y / newscale +
    "px)";
  canvas.style.transformOrigin = "0 0";
  canvas.style.transform = t;
  emitEventScreen();
  checkAnimation();
  checkToolSelection();
};
const zoom = (newscale, center) => {
  const px = center.x;
  const py = center.y;
  const tx = zoomOrigin.x;
  const ty = zoomOrigin.y;

  // local coordinates of center point
  const pointTo = {
    x: (px - tx) / zoomFactor,
    y: (py - ty) / zoomFactor,
  };
  setZoom(newscale, {
    x: px - pointTo.x * newscale,
    y: py - pointTo.y * newscale,
  });
};
const stageMouseWheel = (e) => {
  e.preventDefault();
  const factor = e.deltaY;
  const p = makePos(e.pageX, e.pageY);
  var oldscale = zoomFactor;
  newscale = oldscale * (factor < 0 ? 1.1 : 0.9);
  zoom(newscale, p);
};
const pinchZoom = (e) => {
  const touch1 = e.touches[0];
  const touch2 = e.touches[1];
  if (touch1 && touch2) {
    touch1.offsetX = touch1.pageX; //- $(touch1.target).offset().left;
    touch1.offsetY = touch1.pageY; //- $(touch1.target).offset().top;
    touch2.offsetX = touch2.pageX; //- $(touch2.target).offset().left;
    touch2.offsetY = touch2.pageY; //- $(touch2.target).offset().top;
    socket.emit("log", "pageX " + touch1.pageX + "," + touch1.pageY);
    stagePinch(
      makePos(touch1.offsetX, touch1.offsetY),
      makePos(touch2.offsetX, touch2.offsetY)
    );
  }
  emitEventScreen();
};
const stagePinch = (p1, p2) => {
  const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  if (!pinchLastDist) pinchLastDist = dist;
  const newscale = (zoomFactor * dist) / pinchLastDist;

  const center = makePos(
    Math.abs((p1.x + p2.x) / 2),
    Math.abs((p1.y + p2.y) / 2)
  );
  if (!pinchStartCenter) pinchStartCenter = center;
  socket.emit(
    "log",
    "newscale " + newscale + "," + pinchStartCenter.x + "," + pinchStartCenter.y
  );

  zoom(newscale, pinchStartCenter);
  pinchLastDist = dist;
};

canvas.addEventListener("mousedown", startMouvement);

canvas.addEventListener("mousemove", moveMouvement);
canvas.addEventListener("mousewheel", stageMouseWheel);

canvas.addEventListener("mouseup", stopMouvmeent);
canvas.addEventListener("touchend", stopMouvmeent);

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    e.preventDefault(); // Prevent default touch behavior
    startMouvement(e.touches[0]); // Use the first touch point
  } else if (e.touches.length === 2) {
    zoomStart(e.touches);
  } else {
    stopMouvmeent(e);
  }
});
canvas.addEventListener("touchmove", (e) => {
  socket.emit("log", e.touches);
  e.preventDefault(); // Prevent default touch behavior
  if (e.touches.length === 1) {
    moveMouvement(e.touches[0]); // Use the first touch point
  } else if (e.touches.length === 2) {
    pinchZoom(e);
  } else {
  }
});

createUserData = () => {
  return {
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    canvasX: zoomOrigin.x,
    canvasY: zoomOrigin.y,
    zoom: zoomFactor,
    color: userColor,
  };
};
dropThumnail = (userId) => {
  let userThumbnail = document.getElementById("thumbnail-" + userId);
  if (userThumbnail) {
    userThumbnail.remove();
  }
};

drawThumnail = (
  userId,
  color,
  zoom,
  screenWidth,
  screenHeight,
  canvasX,
  canvasY
) => {
  let userThumbnail = document.getElementById("thumbnail-" + userId);
  if (!userThumbnail) {
    userThumbnail = document.createElement("div");
    thumbnail.appendChild(userThumbnail);
    userThumbnail.id = "thumbnail-" + userId;
    userThumbnail.className = "thumbnail-user";
    userThumbnail.style.borderColor = color;
  }
  clearTimeout(userThumbnail.timeoutId);
  userThumbnail.style.width =
    (screenWidth * thumbnailWidth) / width / zoom + "px";
  userThumbnail.style.height =
    (screenHeight * thumbnailHeight) / height / zoom + "px";
  console.log(screenWidth, screenHeight, thumbnailWidth, thumbnailHeight, zoom);
  userThumbnail.style.left =
    ((-canvasX / zoom) * thumbnailWidth) / width + "px";
  userThumbnail.style.top =
    ((-canvasY / zoom) * thumbnailHeight) / height + "px";
  userThumbnail.style.display = "block";
  userThumbnail.timeoutId = setTimeout(() => {
    userThumbnail.remove();
  }, REMOVE_THUMBNAIL_AFTER); // Remove thumbnail after 1m
};
const socket = io.connect();

socket.on("user-enter", (data) => {
  drawThumnail(
    data.userId,
    data.color,
    data.zoom,
    data.screenWidth,
    data.screenHeight,
    data.canvasX,
    data.canvasY
  );
});
socket.on("user-exit", (data) => {
  dropThumnail(data.userId);
});

emitEventScreen();

socket.on("drawing-data", (data) => {
  drawLine(data.fp, data.tp, data.c, data.bs, data.gco);
  // drawThumnail(
  //   data.userId,
  //   data.zoom,
  //   data.screenWidth,
  //   data.screenHeight,
  //   data.canvasX,
  //   data.canvasY
  // );
});

socket.on("start-drawing", (data) => {
  context.beginPath();
  context.moveTo(data.x, data.y);
});

function analyzeZoomTocuhe(touches) {
  const touch1 = touches[0];
  const touch2 = touches[1];

  const dx = touch2.pageX - touch1.pageX;
  const dy = touch2.pageY - touch1.pageY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate the center point of the two touches
  const centerX = (touch1.pageX + touch2.pageX) / 2;
  const centerY = (touch1.pageY + touch2.pageY) / 2;
  return { centerX, centerY, distance };
}

function drawLine(from, to, color, brushSize, gco) {
  context.strokeStyle = color;
  context.globalCompositeOperation = gco;
  context.lineWidth = brushSize;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
}
