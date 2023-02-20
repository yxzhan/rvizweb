#!/usr/bin/env bash

# IMAGE=rvizweb:noetic

docker run -d --privileged -t -rm --network="host" rvizweb:noetic
