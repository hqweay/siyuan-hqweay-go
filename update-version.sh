#!/bin/bash

# 定义正式发布工作流
run_release() {
  rel_comment="$1"
  skip_bump_check="$2"

  # 自动检测是否有未消费的 changeset (仅在未跳过检查时)
  if [ "$skip_bump_check" != "true" ]; then
    has_changeset=0
    for f in .changeset/*.md; do
      if [ -f "$f" ] && [ "$(basename "$f")" != "README.md" ]; then
        has_changeset=1
        break
      fi
    done

    if [ $has_changeset -eq 1 ]; then
      read -p "发现未消费的 changeset 变更记录。是否自动运行 changeset version 递增版本？[Y/n]: " opt_bump
      if [ "$opt_bump" != "n" ] && [ "$opt_bump" != "N" ]; then
        echo "--> 正在自动递增版本..."
        npx changeset version
      fi
    fi
  fi

  # 读取当前 package.json 版本
  new_version=$(node -p "require('./package.json').version")
  echo "当前最新版本号: $new_version"

  # 同步至 plugin.json
  jq --arg v "$new_version" '.version = $v' plugin.json > tmpfile && mv tmpfile plugin.json

  # 提取最新 Changelog 到 release-note.md
  node scripts/update-changelog-data.cjs

  if [ -z "$rel_comment" ]; then
    read -p "请输入发布备注说明 [回车默认为: upgrade to v$new_version]: " rel_comment
    if [ -z "$rel_comment" ]; then
      rel_comment="upgrade to v$new_version"
    fi
  fi

  echo "正在提交代码: upgrade#$new_version $rel_comment"
  git add .
  git commit -m "upgrade#$new_version $rel_comment"
  git push

  echo "正在打 Git 标签: $new_version"
  # 容错：删除已有的同名标签
  git tag -d "$new_version" 2>/dev/null
  git push origin :refs/tags/"$new_version" 2>/dev/null

  git tag "$new_version"
  git push origin "$new_version"

  echo "🎉 版本 v$new_version 发布成功！"
}

# 渲染控制台菜单
show_menu() {
  echo ""
  echo "=========================================="
  echo " 🦖  恐龙工具箱 - 交互式发版控制台 🦖"
  echo "=========================================="
  echo " 1) ✍️  添加变更记录 (changeset)"
  echo " 2) 🔍 预览待发布变更 (status)"
  echo " 3) 📈 本地递增版本 (changeset version)"
  echo " 4) 🚀 正式发布版本 (release)"
  echo " 5) 💬 快捷 Git 提交 (commit a)"
  echo " 6) 🚪 退出菜单 (exit)"
  echo "=========================================="
}

# 运行交互菜单循环
run_menu() {
  while true; do
    show_menu
    read -p "请选择操作 [1-6]: " opt
    case $opt in
      1)
        echo "--> 启动 changeset 记录记录..."
        npx changeset
        ;;
      2)
        echo "--> 预览待发布变更内容..."
        found=0
        for f in .changeset/*.md; do
          if [ -f "$f" ] && [ "$(basename "$f")" != "README.md" ]; then
            found=1
            echo -e "\n--- 变更文件: $f ---"
            cat "$f"
          fi
        done
        if [ $found -eq 0 ]; then
          echo "提示: 当前没有未发布的 changeset 变更记录。"
        fi
        ;;
      3)
        echo "--> 运行 changeset version..."
        npx changeset version
        ;;
      4)
        echo "--> 执行正式版本发布..."
        run_release
        ;;
      5)
        echo "--> 执行快捷 Git 提交..."
        read -p "请输入 Commit 消息: " commit_msg
        if [ -n "$commit_msg" ]; then
          git add .
          git commit -m "$commit_msg"
          git push
        else
          echo "错误: Commit 消息不能为空！"
        fi
        ;;
      6)
        echo "再见！👋"
        exit 0
        ;;
      *)
        echo "输入无效，请输入 1-6 之间的数字。"
        ;;
    esac
  done
}

# --- 脚本入口主逻辑 ---

if [ $# -eq 0 ]; then
  # 无任何传参，进入交互式菜单模式
  run_menu
else
  # 兼容命令行/CI 自动化参数传参模式
  type_or_version="$1"
  comment="$2"

  if [ "$type_or_version" = "a" ]; then
    if [ -z "$comment" ]; then
      comment="update"
    fi
    echo "Executing quick commit: $comment"
    git add .
    git commit -m "$comment"
    git push
    exit 0
  fi

  if [ "$type_or_version" = "patch" ] || [ "$type_or_version" = "minor" ] || [ "$type_or_version" = "major" ]; then
    echo "Bumping version using npm version: $type_or_version"
    npm version "$type_or_version" --no-git-tag-version
    new_version=$(node -p "require('./package.json').version")
  elif [ -n "$type_or_version" ]; then
    new_version="$type_or_version"
    echo "Setting explicit version: $new_version"
    jq --arg v "$new_version" '.version = $v' package.json > tmpfile && mv tmpfile package.json
  fi

  # 调用统一的发版流，跳过 changeset 检测提示
  run_release "$comment" "true"
fi
