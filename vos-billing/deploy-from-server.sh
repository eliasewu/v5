#!/bin/bash
# One-line deploy pulling from 51.161.47.101 (no GitHub needed)
curl -sk https://51.161.47.101:3443/api/health > /dev/null 2>&1 || { echo "Cannot reach source server"; exit 1; }
mkdir -p /tmp/vos-billing && cd /tmp/vos-billing
scp -o StrictHostKeyChecking=no root@51.161.47.101:/root/vos-billing.bundle . 2>/dev/null
if [ $? -ne 0 ]; then
  echo "SCP failed - copy /root/vos-billing.bundle manually to this server"
  exit 1
fi
git clone vos-billing.bundle vos-billing
cd vos-billing && bash install.sh
