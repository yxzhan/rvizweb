#!/usr/bin/env bash

xhost +local:docker

docker-compose up

xhost -local:docker