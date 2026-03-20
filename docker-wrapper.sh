#!/usr/bin/env bash
# Wrapper to run tempo CLI in Ubuntu 24.04 container
# Required on systems with glibc < 2.38 (e.g. Ubuntu 22.04)
#
# Setup:
#   1. Copy this to ~/.local/bin/tempo
#   2. chmod +x ~/.local/bin/tempo
#   3. Build the runner image: docker build -t tempo-runner -f - . <<< \
#        'FROM ubuntu:24.04\nRUN apt-get update -qq && apt-get install -y -qq ca-certificates > /dev/null 2>&1 && rm -rf /var/lib/apt/lists/*'
#   4. Install tempo inside the container:
#        docker run --rm -v "$HOME/.tempo:/root/.tempo" --network host tempo-runner \
#          bash -c 'curl -fsSL https://tempo.xyz/install | bash && tempo add wallet'

exec docker run --rm -i \
  -v "$HOME/.tempo:/root/.tempo" \
  -v "$(pwd):/work" \
  -w /work \
  --network host \
  tempo-runner \
  /root/.tempo/bin/tempo "$@"
