#!/usr/bin/env bash

pushd "$( dirname "${BASH_SOURCE[0]}" )"
docker build -t "rvizweb:noetic" .
popd
