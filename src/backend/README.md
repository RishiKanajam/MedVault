# Sensor Data Service (Python Backend)

This service simulates real-time sensor and GPS data and exposes REST API endpoints for use by the Inventory and Shipments modules of your application.

---

## Features
- Simulates temperature, humidity, pressure, and GPS data.
- Provides RESTful endpoints for:
  - All sensor data
  - Inventory-specific sensor data
  - Shipments-specific GPS and temperature data
- Easy to extend for real hardware integration.

---

## Requirements
- Python 3.7+
- Flask

Install Flask if you haven't already:
```bash
pip install flask
```

---

## Usage

1. **Navigate to the backend directory:**
   ```bash
   cd src/backend
   ```

2. **Run the service:**
   ```bash
   python sensor_data_service.py
   ```

3. **Service will be available at:**
   - `http://localhost:5001`

---

## API Endpoints

### 1. Get All Sensor Data
- **Endpoint:** `/api/sensors`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "temperature": 25.3,
    "humidity": 60.1,
    "pressure": 1012.8,
    "gps": { "lat": 37.7749, "lon": -122.4194 }
  }
  ```

### 2. Get Inventory Sensor Data
- **Endpoint:** `/api/inventory/sensors`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "temperature": 25.3,
    "humidity": 60.1,
    "pressure": 1012.8
  }
  ```

### 3. Get Shipments GPS & Temperature Data
- **Endpoint:** `/api/shipments/gps`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "gps": { "lat": 37.7749, "lon": -122.4194 },
    "temperature": 25.3
  }
  ```

---

## Integration Notes
- **Inventory Module:**
  - Fetch `/api/inventory/sensors` to get the latest environmental readings for stock management, cold chain, etc.
- **Shipments Module:**
  - Fetch `/api/shipments/gps` to track shipment location and temperature in real time.
- **General:**
  - You can extend the service to connect to real sensors or external APIs by modifying the `update_sensor_data()` function.

---

## Customization
- To add more sensors, update the `sensor_data` dictionary and the `update_sensor_data()` logic.
- To connect to real hardware, replace the random value generation with actual sensor reads.

---

## Example Frontend Fetch (JavaScript)
```js
// Get inventory sensor data
fetch('http://localhost:5001/api/inventory/sensors')
  .then(res => res.json())
  .then(data => console.log(data));

// Get shipment GPS data
fetch('http://localhost:5001/api/shipments/gps')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## License
MIT 