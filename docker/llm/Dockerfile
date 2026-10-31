# LFM3-VL-2B (text + images) served by llama.cpp, for chat and ruling summaries; replaces Gemini.
# b11960 is the first build with LFM3 support. QAD-Q4_0 weights 1.0 GB + Q8_0 vision projector
# 203 MB. Probed on the Pi 2026-10-31 against Q4_K_M: same answers, prompt reading 68 vs 36 tok/s
# (Q4_0 has ARM repacked kernels), writing 9-10 vs 11 tok/s; replies are mostly prompt reading.
FROM ghcr.io/ggml-org/llama.cpp:server-b11960
ARG REPO=https://huggingface.co/LiquidAI/LFM3-VL-2B-GGUF/resolve/main
RUN mkdir -p /models && cd /models \
  && curl -fsSLO "$REPO/LFM3-VL-2B-QAD-Q4_0.gguf" \
  && curl -fsSLO "$REPO/mmproj-LFM3-VL-2B-Q8_0.gguf" \
  && echo "621c455376cb96a20891697deb9975c6fb47dd5ea98ed3ad1f3b7e8f24f0b1e6  LFM3-VL-2B-QAD-Q4_0.gguf" | sha256sum -c - \
  && echo "c5c5b58d544a18da919172d2d0368090ea1a4a351b6feb7f8a326a264a5918ab  mmproj-LFM3-VL-2B-Q8_0.gguf" | sha256sum -c -
EXPOSE 8019
# One slot (requests queue), 3 threads, 8k context; --jinja for the chat template and tool calls.
CMD ["-m", "/models/LFM3-VL-2B-QAD-Q4_0.gguf", "--mmproj", "/models/mmproj-LFM3-VL-2B-Q8_0.gguf", "--jinja", "--host", "0.0.0.0", "--port", "8019", "-t", "3", "-c", "8192", "--parallel", "1"]
