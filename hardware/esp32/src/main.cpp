#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>

// ===== 1. CẤU HÌNH WI-FI & HIVEMQ CLOUD =====
const char* ssid           = "minh tit";
const char* password       = "Minh@123";

const char* mqtt_server    = "da8eb52655df484a9d2142fcec024158.s1.eu.hivemq.cloud";
const int   mqtt_port      = 8883;
const char* mqtt_user      = "nguyenanhminh";
const char* mqtt_password  = "b23dcat196";
const char* mqtt_client_id = "ESP32C3_SmartClassroom_B23DCAT196";

// 3 Topic MQTT
const char* topic_sensors  = "Data_Sensors";
const char* topic_control  = "Device_control";
const char* topic_response = "Device_Response";

// ===== 2. CẤU HÌNH CHÂN PHẦN CỨNG =====
#define DHT_PIN       0
#define DHT_TYPE      DHT11
#define SDA_PIN       8
#define SCL_PIN       9

#define LED_1         3   // Đèn (device_id = 1)
#define LED_2         1   // Quạt (device_id = 2)
#define LED_3         10  // Điều hòa (device_id = 3)

// ===== 3. KHỞI TẠO ĐỐI TƯỢNG NGOẠI VI =====
DHT dht(DHT_PIN, DHT_TYPE);
BH1750 lightMeter;

WiFiClientSecure espClient;
PubSubClient client(espClient);

unsigned long lastRead = 0;

// ===== 4. GỬI PHẢN HỒI THIẾT BỊ (Device_Response) =====
void sendDeviceResponse(long actionId, int deviceId, const char* actionStatus, const char* deviceStatus = nullptr) {
  JsonDocument doc;
  doc["action_id"] = actionId;
  doc["device_id"] = deviceId;
  doc["action_status"] = actionStatus;
  if (deviceStatus != nullptr) {
    doc["device_status"] = deviceStatus;
  }

  char buffer[128];
  serializeJson(doc, buffer);
  client.publish(topic_response, buffer);

  Serial.printf("[Response] %s (action_id=%ld, device_id=%d)\n", actionStatus, actionId, deviceId);
}

// ===== 5. NHẬN LỆNH ĐIỀU KHIỂN (Device_control) =====
void callback(char* topic, byte* payload, unsigned int length) {
  if (strcmp(topic, topic_control) != 0) return;

  JsonDocument doc;
  if (deserializeJson(doc, payload, length)) return;

  if (!doc["action_id"].is<long>() || !doc["device_id"].is<int>() || !doc["action"].is<const char*>()) {
    sendDeviceResponse(doc["action_id"] | 0L, doc["device_id"] | 0, "FAIL");
    return;
  }

  long actionId = doc["action_id"].as<long>();
  int deviceId = doc["device_id"].as<int>();
  const char* action = doc["action"].as<const char*>();

  bool isON = (strcmp(action, "ON") == 0);
  bool isOFF = (strcmp(action, "OFF") == 0);

  if (!isON && !isOFF) {
    sendDeviceResponse(actionId, deviceId, "FAIL");
    return;
  }

  Serial.printf("[Control] action_id=%ld device_id=%d action=%s\n", actionId, deviceId, action);

  if (deviceId == 0) {
    digitalWrite(LED_1, isON ? HIGH : LOW);
    digitalWrite(LED_2, isON ? HIGH : LOW);
    digitalWrite(LED_3, isON ? HIGH : LOW);
    Serial.printf("[Device] ALL LEDs %s\n", isON ? "ON" : "OFF");
    sendDeviceResponse(actionId, 0, "SUCCESS", isON ? "ON" : "OFF");
    return;
  }

  int pin = -1;
  const char* ledName = "";

  if (deviceId == 1) {
    pin = LED_1;
    ledName = "LED1";
  } else if (deviceId == 2) {
    pin = LED_2;
    ledName = "LED2";
  } else if (deviceId == 3) {
    pin = LED_3;
    ledName = "LED3";
  } else {
    sendDeviceResponse(actionId, deviceId, "FAIL");
    return;
  }

  digitalWrite(pin, isON ? HIGH : LOW);
  Serial.printf("[Device] %s %s\n", ledName, isON ? "ON" : "OFF");

  sendDeviceResponse(actionId, deviceId, "SUCCESS", isON ? "ON" : "OFF");
}

// ===== 6. ĐỌC VÀ GỬI DỮ LIỆU CẢM BIẾN (Data_Sensors) =====
void readAndPublishSensors() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  float lux = lightMeter.readLightLevel();

  Serial.printf("[Sensor] Temp: %.1f C | Hum: %.1f %% | Lux: %.1f lx\n",
                isnan(temp) ? 0.0 : temp,
                isnan(hum) ? 0.0 : hum,
                lux < 0 ? 0.0 : lux);

  // Cảm biến 1: Nhiệt độ
  {
    JsonDocument doc;
    doc["sensor_id"] = 1;
    if (isnan(temp)) doc["value"] = nullptr;
    else doc["value"] = round(temp * 10.0) / 10.0;
    char buf[128];
    serializeJson(doc, buf);
    client.publish(topic_sensors, buf);
  }
  delay(30);

  // Cảm biến 2: Độ ẩm
  {
    JsonDocument doc;
    doc["sensor_id"] = 2;
    if (isnan(hum)) doc["value"] = nullptr;
    else doc["value"] = round(hum * 10.0) / 10.0;
    char buf[128];
    serializeJson(doc, buf);
    client.publish(topic_sensors, buf);
  }
  delay(30);

  // Cảm biến 3: Ánh sáng
  {
    JsonDocument doc;
    doc["sensor_id"] = 3;
    if (lux < 0) doc["value"] = nullptr;
    else doc["value"] = round(lux * 10.0) / 10.0;
    char buf[128];
    serializeJson(doc, buf);
    client.publish(topic_sensors, buf);
  }
}

// ===== 7. KẾT NỐI LẠI MQTT =====
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect(mqtt_client_id, mqtt_user, mqtt_password)) {
      Serial.println(" Connected!");
      client.subscribe(topic_control);
    } else {
      Serial.print(" Failed, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

// ===== 8. SETUP =====
void setup() {
  Serial.begin(115200);

  pinMode(LED_1, OUTPUT);
  pinMode(LED_2, OUTPUT);
  pinMode(LED_3, OUTPUT);

  digitalWrite(LED_1, LOW);
  digitalWrite(LED_2, LOW);
  digitalWrite(LED_3, LOW);

  dht.begin();
  Wire.begin(SDA_PIN, SCL_PIN);
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP: ");
  Serial.println(WiFi.localIP());

  // Kết nối TLS HiveMQ Cloud (setInsecure để không cần CA certificate)
  espClient.setInsecure();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  client.setBufferSize(256);
}

// ===== 9. LOOP =====
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  if (millis() - lastRead >= 1500) {
    lastRead = millis();
    readAndPublishSensors();
  }
}