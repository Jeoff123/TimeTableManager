#!/usr/bin/env bash

sleep 0.4
clear

gunicorn -w $(nproc) \
-b $(hostname -I | cut -d' ' -f1):3000 \
"Server Program":application