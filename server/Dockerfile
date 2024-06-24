FROM debian:12-slim AS builder

WORKDIR /app

# Update linux pacakges
RUN apt-get update && \
apt-get install --no-install-suggests --no-install-recommends -y pipx
ENV PATH="/root/.local/bin:${PATH}"

ENV FLASK_RUN_HOST=0.0.0.0 \
FLASK_RUN_PORT=80 \
FLASK_ENV=production

RUN pipx install poetry

COPY poetry.lock pyproject.toml ./

RUN poetry install $(test {FLASK_ENV} == production && echo "--only=main") --no-interaction --no-ansi

COPY . ./

# Rename .env.production
RUN mv .env.production .env

# # Execute Flask
CMD poetry run gunicorn -b ${FLASK_RUN_HOST}:${FLASK_RUN_PORT} app:app