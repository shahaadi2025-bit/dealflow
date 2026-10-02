FROM python:3.11-slim
WORKDIR /srv
COPY requirements.txt requirements-serve.txt .
RUN pip install --no-cache-dir -r requirements-serve.txt
COPY . .
ENV PYTHONUNBUFFERED=1
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]