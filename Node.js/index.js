const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://mqtt-dashboard.com");

client.on("connect", () => {
    const topic = "tfobz/5ic/Tschimben/2/led";
    client.subscribe(topic, (err) => {
        if (!err) {
            client.publish(topic, "Hello specific topic");
        }
    });
});

client.on("message", (topic, message) => {
  console.log(message.toString());
  client.end();
});
