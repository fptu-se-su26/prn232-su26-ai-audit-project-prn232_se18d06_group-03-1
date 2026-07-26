FROM python:3.12.10

WORKDIR /app

RUN pip install --no-cache-dir paddlepaddle==3.2.2

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
