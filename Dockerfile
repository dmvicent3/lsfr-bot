FROM python:3.12.2-slim-bullseye
# Set environment variables
ENV PIP_DISABLE_PIP_VERSION_CHECK 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
COPY . /lsfr-bot_src
WORKDIR /lsfr-bot_src
RUN pip install -r deps.txt

#FORMAT
RUN python3 -m black *.py

#TESTS
#RUN python3 -m pytest -vv test_app.py

#LINTING
RUN python3 -m pylint app.py --disable=R,C
RUN	python3 -m pylint commands.py --disable=R,C
EXPOSE 8443