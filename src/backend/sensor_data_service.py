import random
import time
import os
from flask import Flask, jsonify

app = Flask(__name__)

# Simulated sensor and GPS data
SENSOR_TYPES = ['temperature', 'humidity', 'pressure']

# In-memory store for latest sensor readings
sensor_data = {
    'temperature': 22.5,
    'humidity': 55.0,
    'pressure': 1013.25,
    'gps': {'lat': 37.7749, 'lon': -122.4194}
}

def update_sensor_data():
    # Simulate sensor data changes
    sensor_data['temperature'] = round(random.uniform(20, 30), 2)
    sensor_data['humidity'] = round(random.uniform(40, 70), 2)
    sensor_data['pressure'] = round(random.uniform(1000, 1025), 2)
    # Simulate GPS drift
    sensor_data['gps']['lat'] += random.uniform(-0.0005, 0.0005)
    sensor_data['gps']['lon'] += random.uniform(-0.0005, 0.0005)

@app.route('/api/sensors', methods=['GET'])
def get_sensor_data():
    update_sensor_data()
    return jsonify(sensor_data)

@app.route('/api/inventory/sensors', methods=['GET'])
def get_inventory_sensor_data():
    # Inventory module can use all sensor data
    update_sensor_data()
    return jsonify({
        'temperature': sensor_data['temperature'],
        'humidity': sensor_data['humidity'],
        'pressure': sensor_data['pressure']
    })

@app.route('/api/shipments/gps', methods=['GET'])
def get_shipment_gps_data():
    # Shipments module can use GPS and temperature
    update_sensor_data()
    return jsonify({
        'gps': sensor_data['gps'],
        'temperature': sensor_data['temperature']
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port) 