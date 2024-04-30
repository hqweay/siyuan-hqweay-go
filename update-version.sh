#!/bin/bash

# 从终端获取的参数值

type="$1"

# 检查变量是否等于特定值
if [ "$type" = "a" ]; then
	comment="$2"
	echo "comment: $comment"
  git add .
	git commit -m "$comment"
	git push
else
  new_version="$1"
	comment="$2"
	echo "new_version: $new_version"
	jq --arg new_version "$new_version" '.version = $new_version' package.json > tmpfile && mv tmpfile package.json
	jq --arg new_version "$new_version" '.version = $new_version' plugin.json > tmpfile && mv tmpfile plugin.json

	# git add package.json
	# git add plugin.json
	git add .
	git commit -m "upgrade#$new_version $comment"
	git push
	git tag $new_version
	git push origin $new_version
fi



