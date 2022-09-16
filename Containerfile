FROM node:lts

# Set the SHELL to bash with pipefail option
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Non-interactive mode for apt commands
ENV DEBIAN_FRONTEND noninteractive

# Set timezone:
ENV TZ "Europe/London"
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt update -y && apt-get install -y tzdata

# Setup working directory and copy over project files
WORKDIR /msp
COPY . /msp

# Provision the system
RUN bash /msp/provision.sh

# Ports
EXPOSE 3000

# Keep container running by tailing dev/null
CMD tail -f /dev/null