# Use an official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.11-slim as builder

# Set environment variables to non-interactive (this prevents some prompts).
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory.
WORKDIR /app

# Install system dependencies (for example, GCC to compile any dependencies).
RUN apt-get update \
    && apt-get install --no-install-recommends -y \
    gcc \
    libc-dev \
    libffi-dev \
    make \
    curl \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry.
RUN curl -sSL https://install.python-poetry.org | python3 -

# Ensure the local Poetry version is used, not the global one.
ENV PATH="${PATH}:/root/.local/bin"

# Copy the project requirement files into the working directory.
COPY poetry.lock pyproject.toml ./

# Install dependencies.
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction\
    && pip install googlemaps
# Start a new stage from the slim image to keep the final image clean.
FROM python:3.11-slim

# Install ffmpeg in the final stage
RUN apt-get update \
    && apt-get install --no-install-recommends -y ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy only the needed files from the previous stage.
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the Flask application's entry point and other necessary files.
COPY . .

# Expose the port the app runs on.
EXPOSE 8000

# Command to run the application.
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
