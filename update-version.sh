#!/bin/bash

# 从终端获取的参数值
new_version="$1"

jq --arg new_version "$new_version" '.version = $new_version' package.json > tmpfile && mv tmpfile package.json
jq --arg new_version "$new_version" '.version = $new_version' plugin.json > tmpfile && mv tmpfile plugin.json

# git add package.json
# git add plugin.json
git add .
git commit -m "upgrade#$new_version"
git push
git tag $new_version
git push origin $new_version