const nbEcran = 3;
const width = 1024 * nbEcran;
const height = 768 * nbEcran;

const { createCanvas, Image } = require("canvas");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const dayjs = require("dayjs");

if (!fs.existsSync("images")) {
  fs.mkdirSync("images");
}
if (!fs.existsSync("backup")) {
  fs.mkdirSync("backup");
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const image = [];

const canvas = createCanvas(width, height);
const context = canvas.getContext("2d");
try{
let img2 = new Image();
img2.src = "images/drawing.png";
context.drawImage(img2, 0, 0);
}catch (error) {}

function drawLine(from, to, color, brushSize, gco) {
  context.strokeStyle = color;
  context.globalCompositeOperation = gco;
  context.lineWidth = brushSize;
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
}

function saveImageToFile() {
  const img = canvas.toDataURL("image/png");
  const base64Data = img.replace(/^data:image\/png;base64,/, "");

  filename = "./images/drawing.png";
  fs.writeFile(filename, base64Data, "base64", (err) => {
    if (err) {
      console.error("Error saving image:", err);
    } else {
      console.log("Image saved successfully.");
    }
  });
}
function backupImage() {
  const suffix = dayjs().format("YYYYMMDD-HHmm");
  fs.copyFile(
    "./images/drawing.png",
    `./backup/drawing-${suffix}.png`,
    (err) => {
      if (err) {
        console.error("Error backing up image:", err);
      } else {
        console.log("Image backed up successfully.");
      }
    }
  );
}

setInterval(() => {
  saveImageToFile();
}, 10000); // Save image every 10 seconds

setInterval(() => {
  backupImage();
}, 1000 * 60 * 60); // Backup image every hour

//  {
//   fp: { x: 990, y: 344 },
//   tp: { x: 995, y: 345 },
//   c: '#059f3d',
//   bs: '5'
// }
async function init() {
  /*const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });
  await client.connect();

  const db = client.db(dbName);
  const drawingsCollection = db.collection(collectionName);*/

  app.use(express.static(__dirname));

  io.on("connection", (socket) => {
    console.log("user connected:", socket.id);

    socket.on("drawing-data", async (drawingData) => {
      console.log("drawing-data", drawingData);
      drawLine(
        { x: drawingData.fp.x, y: drawingData.fp.y },
        { x: drawingData.tp.x, y: drawingData.tp.y },
        drawingData.c,
        parseInt(drawingData.bs),
        drawingData.gco
      );
      socket.broadcast.emit("drawing-data", drawingData);
    });

    socket.on("start-drawing", (data) => {
      socket.broadcast.emit("start-drawing", data);
    });
    socket.on("log", (data) => {
      console.log(data);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected:", socket.id);
    });
  });

  app.get("/drawings/:userId", async (req, res) => {
    const userId = req.params.userId;
    //const drawings = await drawingsCollection.find({ userId }).toArray();
    res.json({}); //drawings);
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

init().catch((error) => {
  console.error("Unable to connect to MongoDB.", error);
});
