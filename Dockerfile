# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Stage 1: Build Frontend Dashboard (Node)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/dashboard

# Install dependencies
COPY dashboard/package*.json ./
RUN npm ci

# Copy frontend source and build production assets to /app/dashboard/dist
COPY dashboard/ ./
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Build Python Backend
# -----------------------------------------------------------------------------
FROM python:3.13-slim AS backend

WORKDIR /app

# Install system dependencies needed for compiling or running PostgreSQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast, reliable Python dependency installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency specifications
COPY pyproject.toml uv.lock ./

# Install python dependencies into system environment
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy backend application code and knowledge base
COPY app/ ./app/
COPY knowledge_base/ ./knowledge_base/

# Copy compiled frontend from Stage 1 into dashboard/dist (FastAPI serves this statically)
COPY --from=frontend-builder /app/dashboard/dist ./dashboard/dist

# Create a non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose standard application port
EXPOSE 8000

# Run FastAPI app with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
