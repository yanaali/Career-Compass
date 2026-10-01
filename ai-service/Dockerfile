FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && useradd --create-home compass
COPY compass_ai ./compass_ai
USER compass
EXPOSE 8000
CMD ["uvicorn", "compass_ai.main:app", "--host", "0.0.0.0", "--port", "8000", "--limit-concurrency", "8", "--no-access-log"]
