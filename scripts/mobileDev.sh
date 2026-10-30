#!/usr/bin/env bash
#
# Serves the dev server on the LAN so a real phone can open it, and closes the
# port again on the way out.
#
# `--host` alone is not enough: the firewall drops the connection before Astro
# ever sees it, so the port is opened for as long as this script runs and
# deleted again by the trap below — including on Ctrl-C.
#
# The emulators stay on localhost: the dev server proxies what the browser
# needs from them, see `vite.server.proxy` in astro.config.mjs.
set -euo pipefail

PORT=4321

cleanup() {
  if sudo firewall-cmd --query-port="${PORT}/tcp" > /dev/null; then
    sudo firewall-cmd --remove-port="${PORT}/tcp" > /dev/null
    echo "Closed port $PORT"
  fi
}

trap cleanup EXIT
trap 'exit 0' INT

# Runtime only, without --permanent: should the trap never run, a reload or
# reboot closes the port all the same
sudo firewall-cmd --add-port="${PORT}/tcp" > /dev/null
echo "Opened port $PORT"

# Every address the phone could type in, rather than one guess: a machine on
# both a cable and Wi-Fi has an address per network, the default route is not
# the one the phone shares — Wi-Fi loses on metric — and the phone can only
# reach the network it is on itself. Docker's bridges are global scope too, so
# the virtual interfaces are dropped by name.
echo "Phone (whichever network it is on):"
ip -4 -o addr show scope global |
  grep -Ev ' (docker|br-|veth|virbr)' |
  awk -v port="$PORT" '{split($4, a, "/"); print "  http://" a[1] ":" port "  (" $2 ")"}'
echo

# The dev toolbar is fixed to the bottom edge: on a phone it covers the page
# being looked at, and reads as a layout bug in it.
ASTRO_DEV_TOOLBAR=off "$PWD/node_modules/.bin/astro" dev --host --port "$PORT"
