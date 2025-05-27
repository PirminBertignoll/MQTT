const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MQTT Web Client</title>
    </head>
    <body>
      <h1>MQTT Values</h1>
      <ul id="messages"></ul>
      <input id="blinkMs" type="number" placeholder="Blink duration in ms" />
      <button onclick="ledOn()">LED Ein</button>
      <button onclick="ledOff()">LED Aus</button>
      <button onclick="ledBlink()">LED Blinken</button>
      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();
        socket.on('mqtt_message', function(data) {
          const li = document.createElement('li');
          li.textContent = 'Topic: ' + data.topic + ', Message: ' + data.message;
          document.getElementById('messages').appendChild(li);
        });
        
        function ledOn() { socket.emit('led_control', 'on'); }
        function ledOff() { socket.emit('led_control', 'off'); }
        function ledBlink() {
          const ms = document.getElementById('blinkMs').value;
          socket.emit('led_control', ms);
        }
      </script>
    </body>
    </html>
  `);
});

const mqttClient = mqtt.connect("wss://mqtt-dashboard.com:8884/mqtt", {
  protocol: "wss",
  rejectUnauthorized: false,
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker Temp");
  mqttClient.subscribe("tfobz/5ic/gruppe2/temp");
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker Led");
  mqttClient.subscribe("tfobz/5ic/gruppe2/led");
});

mqttClient.on("message", (topic, message) => {
  console.log(`Received message on topic ${topic}: ${message.toString()}`);
  io.emit("mqtt_message", { topic, message: message.toString() });
});

io.on("connection", (socket) => {
  socket.on("led_control", (command) => {
    mqttClient.publish("tfobz/5ic/gruppe2/led", command.toString());
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
