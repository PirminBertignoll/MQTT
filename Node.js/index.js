const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// === Konfiguration ===
const LED_TOPIC = "tfobz/5ic/gruppe2/led";
const MQTT_BROKER = "mqtt://mqtt-dashboard.com";

// === MQTT Setup ===
const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on("connect", () => {
  console.log("Verbunden mit dem MQTT-Broker");
});

mqttClient.on("error", (err) => {
  console.error("MQTT-Fehler:", err);
});

// === Webserver ===
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("Webclient verbunden");

  // Empfange LED-Befehle vom Webclient
  socket.on("led", (cmd) => {
    console.log(`Empfangener LED-Befehl: ${cmd}`);
    mqttClient.publish(LED_TOPIC, cmd); // Sende den Befehl über MQTT
  });
});

// Starte den Webserver
server.listen(3000, () => {
  console.log("Webserver läuft auf http://localhost:3000");
});
