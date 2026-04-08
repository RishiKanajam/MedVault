# Transaction Simulation Guide

This guide explains how to simulate 1,000+ daily transactions for testing prescription analysis and logistics processing.

## Overview

The transaction simulation system processes bulk transactions for:
- **Prescription Analysis**: AI-powered medication suggestions using Gemini API
- **Logistics Processing**: Shipment creation and tracking

## Prerequisites

1. **Firebase Admin SDK** configured:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

2. **Google AI API Key** (optional, for AI-powered prescription analysis):
   ```env
   GOOGLE_AI_API_KEY=your-gemini-api-key
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

## Usage

### Method 1: Command Line Script

Run the simulation script directly:

```bash
# Default: 600 prescriptions + 400 shipments = 1,000 transactions
npm run simulate:transactions

# Custom counts
PRESCRIPTION_COUNT=800 SHIPMENT_COUNT=200 npm run simulate:transactions

# Daily simulation (1,000+ transactions)
npm run simulate:daily

# With custom clinic ID
CLINIC_ID=your-clinic-id npm run simulate:transactions

# Without AI (faster, uses fallback medication names)
USE_AI=false npm run simulate:transactions

# Custom batch size and delay
BATCH_SIZE=100 DELAY_MS=50 npm run simulate:transactions
```

### Method 2: API Endpoint

Call the bulk processing API endpoint:

```bash
POST /api/bulk/transactions

{
  "prescriptionCount": 600,
  "shipmentCount": 400,
  "batchSize": 50,
  "delayMs": 100
}
```

**Example with curl**:
```bash
curl -X POST http://localhost:9002/api/bulk/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=your-session-cookie" \
  -d '{
    "prescriptionCount": 600,
    "shipmentCount": 400,
    "batchSize": 50,
    "delayMs": 100
  }'
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLINIC_ID` | Firebase clinic ID | `default-clinic` |
| `PRESCRIPTION_COUNT` | Number of prescriptions to simulate | `600` |
| `SHIPMENT_COUNT` | Number of shipments to simulate | `400` |
| `BATCH_SIZE` | Transactions per batch | `50` |
| `DELAY_MS` | Delay between batches (ms) | `100` |
| `USE_AI` | Enable AI-powered prescription analysis | `true` |

### Parameters

- **prescriptionCount**: Number of prescription transactions to generate
- **shipmentCount**: Number of shipment transactions to generate
- **batchSize**: Number of transactions processed in parallel per batch
- **delayMs**: Milliseconds to wait between batches (rate limiting)
- **useAI**: Whether to use Gemini API for prescription analysis (slower but more realistic)

## Transaction Types

### Prescription Transactions

Each prescription transaction:
1. Generates random patient data (name, age, weight, symptoms)
2. Calls Gemini API for medication suggestion (if `useAI=true`)
3. Creates patient record in Firestore
4. Creates prescription record entry

**Data Structure**:
```
clinics/{clinicId}/patients/{patientId}
  - name, dateOfBirth, medicalHistory, allergies

clinics/{clinicId}/patients/{patientId}/records/{recordId}
  - date, type: 'prescription', summary, files
```

### Shipment Transactions

Each shipment transaction:
1. Generates random medicine data
2. Creates shipment with tracking number
3. Sets random status (Pre-Transit, In Transit, etc.)
4. Configures cold chain settings

**Data Structure**:
```
clinics/{clinicId}/shipments/{shipmentId}
  - medicineId, medicineName, courier, trackingNumber
  - status, pickupDate, estimatedDelivery
  - coldChain, minTemp, maxTemp, temperatureLog
```

## Performance Metrics

The simulation script outputs metrics:

```
✨ Simulation complete!
📊 Metrics:
   - Prescriptions: 600
   - Shipments: 400
   - Total transactions: 1000
   - AI API calls: 600
   - Errors: 0
   - Duration: 45.32s
   - Rate: 22.06 transactions/sec
```

Metrics are saved to `transaction-metrics.json` in the project root.

## Example: Daily Simulation

To simulate a full day of transactions (1,000+):

```bash
# Run multiple times throughout the day
# Or use a single large batch
PRESCRIPTION_COUNT=1000 SHIPMENT_COUNT=500 npm run simulate:transactions

# Total: 1,500 transactions
```

## Rate Limiting

To avoid overwhelming Firebase or API quotas:

1. **Adjust batch size**: Smaller batches = less parallel load
   ```bash
   BATCH_SIZE=25 npm run simulate:transactions
   ```

2. **Add delays**: Increase delay between batches
   ```bash
   DELAY_MS=500 npm run simulate:transactions
   ```

3. **Disable AI**: Faster processing without API calls
   ```bash
   USE_AI=false npm run simulate:transactions
   ```

## Monitoring

### Check Firestore

View transactions in Firebase Console:
- Navigate to Firestore Database
- Check `clinics/{clinicId}/patients` and `clinics/{clinicId}/shipments`
- Verify transaction counts match metrics

### Check Metrics File

After simulation, review `transaction-metrics.json`:
```json
{
  "prescriptionsProcessed": 600,
  "shipmentsProcessed": 400,
  "aiApiCalls": 600,
  "errors": 0,
  "startTime": "2024-01-01T12:00:00.000Z",
  "endTime": "2024-01-01T12:00:45.320Z",
  "duration": 45320
}
```

## Troubleshooting

### Error: Firebase Admin not initialized / "Service account object must contain a string 'project_id' property"

**Cause**: Environment variables not loaded or incorrect format.

**Solutions**:
1. **Create `.env.local` file** in the project root:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_AI_API_KEY=your-gemini-api-key
   ```

2. **Or export environment variables** before running:
   ```bash
   export FIREBASE_PROJECT_ID=your-project-id
   export FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   npm run simulate:transactions
   ```

3. **Check private key format**: Ensure `FIREBASE_PRIVATE_KEY` includes the full key with `\n` for newlines or use actual newlines in `.env.local`

4. **Verify variables are loaded**:
   ```bash
   # Check if variables are set
   echo $FIREBASE_PROJECT_ID
   echo $FIREBASE_CLIENT_EMAIL
   ```

### Error: GOOGLE_AI_API_KEY not configured
- Set `GOOGLE_AI_API_KEY` environment variable, or
- Run with `USE_AI=false` to skip AI calls

### Error: Rate limit exceeded
- Reduce `BATCH_SIZE` and increase `DELAY_MS`
- Use `USE_AI=false` to avoid API rate limits

### Slow performance
- Reduce `BATCH_SIZE` to process smaller batches
- Increase `DELAY_MS` to add more delay between batches
- Use `USE_AI=false` to skip AI API calls

## Integration with CI/CD

Add to your deployment pipeline:

```yaml
# cloudbuild.yaml example
- name: 'gcr.io/cloud-builders/gcloud'
  entrypoint: 'bash'
  args:
    - -c
    - |
      npm install
      npm run simulate:transactions
```

## Security Notes

- The API endpoint requires authentication (`verifySession`)
- Use Firebase Admin SDK for server-side operations
- Do not expose API keys in client-side code
- Monitor API usage to avoid quota exhaustion

## Next Steps

- Implement load testing with multiple concurrent simulations
- Add real-time monitoring dashboard
- Create scheduled jobs for continuous simulation
- Integrate with Firebase Analytics for metrics tracking

