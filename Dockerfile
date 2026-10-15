FROM oven/bun:1.4.3
# pdftotext, for reading FIA stewards' rulings.
RUN apt-get update   && apt-get install -y --no-install-recommends poppler-utils   && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run check

CMD ["bun", "run", "start"]
