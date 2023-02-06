#!/usr/bin/env bash

printf "\n++++++++++++++++++++ Start server configuration ++++++++++++++++++++\n"
apt update -y
apt install -y git curl wget tar gzip findutils vim software-properties-common zip unzip iputils-ping net-tools

printf "\n++++++++++++++++++++ App setup ++++++++++++++++++++\n"
cd /msp
npm install --global yarn
yarn

printf "\n++++++++++++++++++++ Cleanup ++++++++++++++++++++\n"
apt -y autoremove
apt clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*