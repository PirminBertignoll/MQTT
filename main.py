import paho.mqtt.client as mqtt
import RPi.GPIO as GPIO
import time

# === Configuration ===
LED_PIN = 17
BROKER = "mqtt://mqtt-dashboard.com"
LED_TOPIC = "tfobz/5ic/gruppe2/led"

# === GPIO Setup ===
GPIO.setmode(GPIO.BCM)
GPIO.setup(LED_PIN, GPIO.OUT)

blink_interval = None
blink_thread = None

# === MQTT Callbacks ===
def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker with result code " + str(rc))
    client.subscribe(LED_TOPIC)

def on_message(client, userdata, msg):
    global blink_interval
    payload = msg.payload.decode().strip().lower()

    if blink_interval:
        blink_interval = None

    if payload == "on":
        GPIO.output(LED_PIN, GPIO.HIGH)
    elif payload == "off":
        GPIO.output(LED_PIN, GPIO.LOW)
    elif payload.isdigit():
        blink_interval = int(payload)

# === Blink Function ===
def blink_led():
    global blink_interval
    while True:
        if blink_interval:
            GPIO.output(LED_PIN, GPIO.HIGH)
            time.sleep(blink_interval / 1000.0)
            GPIO.output(LED_PIN, GPIO.LOW)
            time.sleep(blink_interval / 1000.0)
        else:
            time.sleep(0.1)

# === Main Program ===
if __name__ == "__main__":
    try:
        # Start MQTT Client
        client = mqtt.Client()
        client.on_connect = on_connect
        client.on_message = on_message
        client.connect(BROKER, 1883, 60)

        # Start Blink Thread
        import threading
        blink_thread = threading.Thread(target=blink_led)
        blink_thread.daemon = True
        blink_thread.start()

        # Loop Forever
        client.loop_forever()
    except KeyboardInterrupt:
        print("Exiting program...")
    finally:
        GPIO.cleanup()