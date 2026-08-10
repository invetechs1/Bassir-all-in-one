# Deployment

How to build the Bassir All-in-One Docker image locally and ship it to the
SSH server as a `.tar` file, without touching any other project/image
already running on that server.

Naming used everywhere below (change if you like, just keep it consistent):

- Image name: `bassir-all-in-one`
- Container name: `bassir-all-in-one`
- Remote folder: `/opt/bassir-all-in-one`
- Tar file: `bassir-all-in-one.tar`

## 0. Prerequisites

- Docker Desktop (or Docker Engine) running locally.
- SSH access to the server: `ssh root@13.140.138.252`.

## 1. Remove the old local image (if any)

Only removes *this project's* image/container — nothing else on the machine.

```bash
docker rm -f bassir-all-in-one 2>/dev/null || true
docker rmi bassir-all-in-one:latest 2>/dev/null || true
```

## 2. Build the new image

From the project root (where the `Dockerfile` is):

```bash
docker build -t bassir-all-in-one:latest .
```

## 3. Save the image to a tar file

```bash
docker save -o bassir-all-in-one.tar bassir-all-in-one:latest
```

## 4. Create the project folder on the server and copy the tar there

```bash
ssh root@13.140.138.252 "mkdir -p /opt/bassir-all-in-one"
scp bassir-all-in-one.tar root@13.140.138.252:/opt/bassir-all-in-one/bassir-all-in-one.tar
```

## 5. Create the deploy script on the server

Save as `/opt/bassir-all-in-one/deploy.sh` on the server (see script body
below). It only ever touches the `bassir-all-in-one` image/container —
every other container/image on the box is left alone.

```bash
#!/bin/bash
set -euo pipefail

APP_DIR="/opt/bassir-all-in-one"
IMAGE="bassir-all-in-one:latest"
CONTAINER="bassir-all-in-one"
TAR="$APP_DIR/bassir-all-in-one.tar"
PORT="${PORT:-3007}"

echo "Stopping and removing old container (if any)..."
docker rm -f "$CONTAINER" 2>/dev/null || true

echo "Removing old image (if any)..."
docker rmi "$IMAGE" 2>/dev/null || true

echo "Loading new image from $TAR..."
docker load -i "$TAR"

echo "Starting new container..."
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  -p "$PORT:3000" \
  -v "$APP_DIR/data:/app/data" \
  "$IMAGE"

echo "Deployed. Container status:"
docker ps --filter "name=$CONTAINER"
```

Make it executable:

```bash
ssh root@13.140.138.252 "chmod +x /opt/bassir-all-in-one/deploy.sh"
```

## 6. Run the deploy

```bash
ssh root@13.140.138.252 "/opt/bassir-all-in-one/deploy.sh"
```

Portal will be reachable at `http://13.140.138.252:3007` directly, and at
`https://bassirfarm.bassir.net` through the nginx reverse proxy + TLS cert
already configured on the server (proxies to the same `:3007` container —
nothing to change here when that's updated). Port 3000 is already used by
another app on this server (`zahra-travel-app-1`), so 3007 was picked
instead; adjust with `PORT=xxxx /opt/bassir-all-in-one/deploy.sh` if you
need a different port later.

## Re-deploying later (new code changes)

Repeat steps 1–4 locally to rebuild + resend the tar, then just re-run:

```bash
ssh root@13.140.138.252 "/opt/bassir-all-in-one/deploy.sh"
```

The script already removes only the previous `bassir-all-in-one` image and
container before loading the new one, so nothing else running on the server
is affected.
