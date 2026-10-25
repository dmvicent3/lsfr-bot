# jevos (github.com/feder-cr/jev) served by llama.cpp. jev's own OpenVINO server builds on the Pi 5 but
# holds ~4 GB there (ARM unpacks the int8 weights); llama.cpp runs the release's Q4_K_M GGUF in ~1 GB.
FROM ghcr.io/ggml-org/llama.cpp:server-b11870
ARG JEV_TAG=jevos-v5
RUN mkdir -p /models && cd /models \
  && base="https://github.com/feder-cr/jev/releases/download/$JEV_TAG" \
  && curl -fsSLO "$base/jevos-v5-q4_k_m.gguf" \
  && curl -fsSL "$base/SHA256SUMS.txt" | grep 'jevos-v5-q4_k_m.gguf$' | tr -d '*' | sha256sum -c -
EXPOSE 8017
# One slot (requests queue in Gork anyway), 2 threads, 2048-token context.
CMD ["-m", "/models/jevos-v5-q4_k_m.gguf", "--host", "0.0.0.0", "--port", "8017", "-t", "2", "-c", "2048", "--parallel", "1"]
