# app/Dockerfile

FROM python:3.10-slim

WORKDIR /app
COPY . .


RUN pip install --upgrade pip
RUN pip install -r ../requirements

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
