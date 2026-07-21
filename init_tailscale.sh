docker exec tunnel-frontend tailscale serve reset
docker exec tunnel-frontend tailscale funnel --bg http://localhost:1000
docker exec tunnel-backend tailscale serve reset
docker exec tunnel-backend tailscale funnel --bg http://localhost:1001