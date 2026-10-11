# ─────────────────────────────────────────────────────────────────────────────
# FitAI ML Backend — Dockerfile
# Build: docker build -t fitai-backend .
# Run:   docker run -p 8000:8000 fitai-backend
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install Python deps first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Copy pre-trained ML models
COPY models/ ./models/

# Expose the API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run with uvicorn (production-grade ASGI server)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
