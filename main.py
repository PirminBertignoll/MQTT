import paho.mqtt.client as mqtt
import RPi.GPIO as GPIO
import time
import smbus

# === Configuration ===
LED_PIN = 17
BROKER = "mqtt-dashboard.com"
LED_TOPIC = "tfobz/5ic/gruppe2/led"
TEMP_PIN = 18
TEMP_TOPIC = "tfobz/5ic/gruppe2/temp"

# === GPIO Setup ===
GPIO.setmode(GPIO.BCM)
GPIO.setup(LED_PIN, GPIO.OUT)

blink_interval = None
blink_thread = None

I2C_BUS = 1
TEMP_SENSOR_ADDR = 0x48

bus = smbus.SMBus(I2C_BUS)

def read_temperature():
    try:
        temp_c = bus.read_byte(TEMP_SENSOR_ADDR)
        return temp_c
    except Exception as e:
        print(f"Fehler beim Auslesen des Temperatursensors: {e}")
        return None

def temp_publisher(client):
    while True:
        temp = read_temperature()
        if temp is not None:
            client.publish(TEMP_TOPIC, f"{temp:.2f}")
        time.sleep(5)

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

        # Start Temperature Publisher Thread
        temp_thread = threading.Thread(target=temp_publisher, args=(client,))
        temp_thread.daemon = True
        temp_thread.start()

        # Loop Forever
        client.loop_forever()
    except KeyboardInterrupt:
        print("Exiting program...")
    finally:
        GPIO.cleanup()
