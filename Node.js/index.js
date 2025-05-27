const express = require('express');
const http = require('http');
const mqtt = require('mqtt');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MQTT Web Client</title>
    </head>
    <body>
      <h1>MQTT Values</h1>
      <ul id="messages"></ul>
      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();
        socket.on('mqtt_message', function(data) {
          const li = document.createElement('li');
          li.textContent = 'Topic: ' + data.topic + ', Message: ' + data.message;
          document.getElementById('messages').appendChild(li);
        });
      </script>
    </body>
    </html>
  `);
});

const mqttClient = mqtt.connect('mqtt-dashboard.com:8884');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('/tfobz/5ic/gruppe2/temp');
});

mqttClient.on('message', (topic, message) => {
  console.log(`Received message on topic ${topic}: ${message.toString()}`);
  io.emit('mqtt_message', { topic, message: message.toString() });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});