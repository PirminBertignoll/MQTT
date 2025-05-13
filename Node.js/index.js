const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const socketIo = require("socket.io");
const Gpio = require("pigpio").Gpio;
const i2c = require("i2c-bus");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// === Konfiguration ===
const LED_PIN = 17;
const led = new Gpio(LED_PIN, { mode: Gpio.OUTPUT });
const TEMP_TOPIC = "tfobz/5ic/gruppe2/temp";
const LED_TOPIC = "tfobz/5ic/gruppe2/led";
const MQTT_BROKER = "mqtt://mqtt-dshboard.com";

let blinkInterval = null;

// === MQTT Setup ===
const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on("connect", () => {
  console.log("MQTT verbunden");
  mqttClient.subscribe(LED_TOPIC);
});

mqttClient.on("message", (topic, message) => {
  const payload = message.toString().trim().toLowerCase();

  if (topic === LED_TOPIC) {
    if (blinkInterval) clearInterval(blinkInterval);

    if (payload === "on") {
      led.digitalWrite(1);
    } else if (payload === "off") {
      led.digitalWrite(0);
    } else if (!isNaN(payload)) {
      let state = 0;
      blinkInterval = setInterval(() => {
        state ^= 1;
        led.digitalWrite(state);
      }, parseInt(payload));
    }
  }
});

// === Webserver ===
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("Webclient verbunden");
  socket.on("led", (cmd) => {
    mqttClient.publish(LED_TOPIC, cmd);
  });
});

server.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});

process.on('SIGINT', () => {
  led.digitalWrite(0);
  process.exit();
});
