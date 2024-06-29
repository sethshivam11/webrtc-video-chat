const express = require("express");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const io = new Server({
  cors: true,
});
const app = express();

app.use(bodyParser.json());

const emailIdSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log("New connection");
  socket.on("join-room", (data) => {
    const { emailId, roomId } = data;
    console.log("User", emailId, "joined room", roomId);
    emailIdSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailIdSocketMapping.get(emailId);
    socket.to(socketId).emit("incoming-call", {
      from: fromEmail,
      offer,
    })
  });

  socket.on("call-accepted", (data) => {
    const {emailId, ans} = data;
    const socketId = emailIdSocketMapping.get(emailId);
    socket.to(socketId).emit("call-accepted", {ans});
})
});

app.listen(3000, () => console.log("HTTP Server started on port 3000"));
io.listen(3001);

// ------------------------------- deployment --------------------------------

const path = require("path");
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "client", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "client", "dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("App is running successfully");
  });
}