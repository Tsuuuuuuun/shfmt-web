#!/bin/bash

if [ -z "$1" ];then
echo "Usage: $0 <filename>"
  exit 1
fi

for file in  "$@"
do
if [ -f "$file" ]; then
    cat "$file"|grep -v "^#"|while read line
do
  echo "Processing: $line"
      done
else
echo "File not found: $file" >&2
fi
done
