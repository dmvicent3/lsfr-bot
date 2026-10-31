# LFM3-VL-2B (text + images) served by llama.cpp, for chat and ruling summaries; replaces Gemini.
# b11960 is the first build with LFM3 support. Q4_K_M weights 1.1 GB + Q8_0 vision projector 203 MB.
FROM ghcr.io/ggml-org/llama.cpp:server-b11960
ARG REPO=https://huggingface.co/LiquidAI/LFM3-VL-2B-GGUF/resolve/main
RUN mkdir -p /models && cd /models \
  && curl -fsSLO "$REPO/LFM3-VL-2B-Q4_K_M.gguf" \
  && curl -fsSLO "$REPO/mmproj-LFM3-VL-2B-Q8_0.gguf" \
  && echo "56dac2e192ff0d9ab8507f4f1aeb4aed0463449bbbefaac79497f041c95f21eb  LFM3-VL-2B-Q4_K_M.gguf" | sha256sum -c - \
  && echo "c5c5b58d544a18da919172d2d0368090ea1a4a351b6feb7f8a326a264a5918ab  mmproj-LFM3-VL-2B-Q8_0.gguf" | sha256sum -c -
EXPOSE 8019
# One slot (requests queue), 3 threads, 8k context; --jinja for the chat template and tool calls.
CMD ["-m", "/models/LFM3-VL-2B-Q4_K_M.gguf", "--mmproj", "/models/mmproj-LFM3-VL-2B-Q8_0.gguf", "--jinja", "--host", "0.0.0.0", "--port", "8019", "-t", "3", "-c", "8192", "--parallel", "1"]
