#!/bin/sh

FIRST_ARGUMENT="$1"
SECOND_ARGUMENT="$2"
THIRD_ARGUMENT="$3"
CURDIR="$(pwd)"


if [ $FIRST_ARGUMENT == "pub" ] 
then
  npx ts-node precode/publish.ts
fi

