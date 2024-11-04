#!/bin/sh
#
# Use this script to run your program.
#
set -e # Exit early if any commands fail

exec deno run --allow-read --allow-write $(dirname "$0")/main.ts "$@"