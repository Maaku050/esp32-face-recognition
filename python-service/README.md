# InsightFace Recognition Service

A Python microservice for face detection, recognition, and analysis using InsightFace.

## Features

- 512-dimensional face embeddings using InsightFace Buffalo_L model
- 99%+ accuracy on face recognition
- Face detection with bounding boxes
- Gender and age estimation
- Quality score for detected faces
- Batch comparison support
- RESTful API

## Requirements

- Python 3.11+
- 2GB RAM minimum
- ~500MB disk space for models

## Quick Start

### Option 1: Using Setup Script (Recommended)

```bash
# Setup (first time only)
bash setup.sh

# Run the service
bash run.sh
```

### Option 2: Manual Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the service
python insightface_service.py
```

### Option 3: Using Docker

```bash
# Build image
docker build -t insightface-service .

# Run container
docker run -p 5000:5000 insightface-service
```

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "InsightFace Recognition Service",
  "model": "buffalo_l",
  "ready": true
}
```

### POST /extract-embedding
Extract face embedding from image

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: image file (JPEG/PNG)

**Response:**
```json
{
  "success": true,
  "embedding": [0.123, -0.456, ...],
  "embedding_size": 512,
  "num_faces_detected": 1,
  "face": {
    "bbox": {"x1": 100, "y1": 50, "x2": 300, "y2": 350},
    "quality_score": 0.98,
    "gender": "male",
    "age": 25
  }
}
```

### POST /compare-embeddings
Compare two face embeddings

**Request:**
```json
{
  "embedding1": [0.123, -0.456, ...],
  "embedding2": [0.789, -0.012, ...]
}
```

**Response:**
```json
{
  "success": true,
  "distance": 0.15,
  "similarity": 92.5,
  "is_match": true,
  "confidence": "very_high"
}
```

### POST /batch-compare
Compare one embedding against multiple

**Request:**
```json
{
  "query_embedding": [0.123, ...],
  "stored_embeddings": [
    {"id": "1", "name": "John", "embedding": [...]},
    {"id": "2", "name": "Jane", "embedding": [...]}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "matches": [
    {
      "id": "1",
      "name": "John",
      "distance": 0.12,
      "similarity": 94.0,
      "is_match": true
    }
  ]
}
```

## Configuration

Edit `insightface_service.py` to change:

- `MODEL_NAME`: Model to use (buffalo_l, buffalo_s, buffalo_sc)
- `DETECTION_SIZE`: Detection input size (default: 640x640)
- `SIMILARITY_THRESHOLD`: Match threshold (default: 0.30)

## Model Options

| Model | Accuracy | Speed | Size |
|-------|----------|-------|------|
| buffalo_l | Best | Medium | ~280MB |
| buffalo_s | Good | Fast | ~140MB |
| buffalo_sc | Fair | Fastest | ~70MB |

## Troubleshooting

### Models not downloading
```bash
python -c "from insightface.app import FaceAnalysis; app = FaceAnalysis(name='buffalo_l'); app.prepare(ctx_id=0)"
```

### GPU Support (Optional)
```bash
pip install onnxruntime-gpu
# Change in code: providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
```

### Port already in use
Change port in `insightface_service.py`:
```python
app.run(host='0.0.0.0', port=5001)  # Change from 5000
```

## Performance

- First request: 20-30 seconds (model loading)
- Subsequent requests: 2-5 seconds
- Batch processing: ~100ms per face

## License

MIT License