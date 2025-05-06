const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const socketIo = require("socket.io");
const Gpio = require("onoff").Gpio;
const i2c = require("i2c-bus");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// === Konfiguration ===
const LED_PIN = 17;
const led = new Gpio(LED_PIN, 'out');
const TEMP_TOPIC = "tfobz/5ia/deinname/temp";
const LED_TOPIC = "tfobz/5ia/deinname/led";
const MQTT_BROKER = "mqtt://test.mosquitto.org";

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
      led.writeSync(1);
    } else if (payload === "off") {
      led.writeSync(0);
    } else if (!isNaN(payload)) {
      let state = 0;
      blinkInterval = setInterval(() => {
        state = state ^ 1;
        led.writeSync(state);
      }, parseInt(payload));
    }
  }
});

// === Temperatur aus MPU6050 auslesen ===
const i2c1 = i2c.openSync(1);
const MPU6050_ADDR = 0x68;
i2c1.writeByteSync(MPU6050_ADDR, 0x6B, 0); // Wake up

function readTemperature() {
  const high = i2c1.readByteSync(MPU6050_ADDR, 0x41);
  const low = i2c1.readByteSync(MPU6050_ADDR, 0x42);
  let raw = (high << 8) | low;
  if (raw > 32767) raw -= 65536;
  return (raw / 340.0 + 36.53).toFixed(2);
}

// === Temperatur regelmäßig senden ===
setInterval(() => {
  const temp = readTemperature();
  mqttClient.publish(TEMP_TOPIC, temp);
  io.emit("temperature", temp);
}, 5000);

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
  led.writeSync(0);
  led.unexport();
  process.exit();
});
