# ============================================================
#   Sandbox YGN — DevOps Foundational · Session 3.2
#   Dockerfile for Sample Node.js Web App
# ============================================================

# ── Stage 1: Base image ──────────────────────────────────────
# Use an official, lightweight Node.js image from Docker Hub.
# "alpine" variant = minimal Linux (~7 MB) → smaller final image.
FROM node:20-alpine

# ── Stage 2: Set working directory ──────────────────────────
# All subsequent commands (COPY, RUN, CMD) run from /app inside the container.
WORKDIR /app

# ── Stage 3: Copy dependency files FIRST ────────────────────
# Copy package.json and package-lock.json BEFORE the rest of the code.
# Docker caches each layer; this means npm install only re-runs when
# dependencies change — not every time your source code changes.
COPY package*.json ./

# ── Stage 4: Install dependencies ───────────────────────────
# --omit=dev skips devDependencies (e.g. nodemon) in production.
RUN npm install --omit=dev

# ── Stage 5: Copy application source code ───────────────────
# Copy everything else (app.js, public/, etc.) into the container.
COPY . .

# ── Stage 6: Expose port ─────────────────────────────────────
# Documents which port the app listens on. Does NOT publish it to the host.
# Use -p 3000:3000 with `docker run` to actually publish.
EXPOSE 3000

# ── Stage 7: Set environment variable ───────────────────────
ENV NODE_ENV=production

# ── Stage 8: Health check ────────────────────────────────────
# Docker polls this command every 30s. If it fails 3 times → "unhealthy".
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# ── Stage 9: Define the start command ───────────────────────
# CMD is the default command run when the container starts.
# Uses exec form (JSON array) — best practice.
CMD ["node", "app.js"]