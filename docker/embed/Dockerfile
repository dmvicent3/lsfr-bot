# EmbeddingGemma 2 (text only) served by llama.cpp, for the RSS repeat check. Same image as jev;
# b11870 includes EmbeddingGemma 2 support (llama.cpp PR #30054). ~390 MB on the Pi.
FROM ghcr.io/ggml-org/llama.cpp:server-b11870
ARG MODEL=embeddinggemma-2-UD-Q4_K_XL.gguf
ARG SHA256=ea905fd08e8061db77a0031cbb5096d459d7cfd2bdd0ad2ba66e483f16719493
RUN mkdir -p /models && cd /models \
  && curl -fsSLO "https://huggingface.co/unsloth/embeddinggemma-2-GGUF/resolve/main/$MODEL" \
  && echo "$SHA256  $MODEL" | sha256sum -c -
EXPOSE 8018
# Titles only, so a 512-token context; one slot, one thread.
CMD ["-m", "/models/embeddinggemma-2-UD-Q4_K_XL.gguf", "--embeddings", "--pooling", "mean", "--host", "0.0.0.0", "--port", "8018", "-t", "1", "-c", "512", "-b", "512", "-ub", "512", "--parallel", "1"]
