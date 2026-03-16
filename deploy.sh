#!/bin/bash
# deploy.sh — stage, commit, push to GitHub → Vercel auto-deploys
#
# Usage:
#   ./deploy.sh                          # uses timestamp as commit message
#   ./deploy.sh "feat: add player stats" # custom commit message

set -e

MSG="${1:-deploy: $(date '+%Y-%m-%d %H:%M')}"

# Safety check — never commit .env files
if git diff --cached --name-only | grep -q "\.env"; then
  echo "ERROR: .env file is staged. Remove it first."
  exit 1
fi

git add -u          # stage all modified tracked files
git add src public  # stage new files in src/ and public/

# Skip if nothing to commit
if git diff --cached --quiet; then
  echo "Nothing to commit — already up to date."
  git push
  exit 0
fi

git commit -m "$MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git push

echo ""
echo "Pushed to GitHub. Vercel is deploying now."
echo "Check: https://vercel.com/dashboard"
