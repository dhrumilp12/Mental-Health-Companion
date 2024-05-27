# Use an official Python runtime as a base image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file, to cache the pip install step
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application's code
COPY .env .
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable to configure uvicorn
ENV UVICORN_HOST=0.0.0.0
ENV UVICORN_PORT=8000

# Run the uvicorn server when the container launches
CMD uvicorn app:app --host $UVICORN_HOST --port $UVICORN_PORT