# Git Commands Reference — japtapsamagams

Quick reference for common git operations in this repo.

---

## Table of Contents

1. [Setup](#1-setup)
2. [Branches](#2-branches)
3. [Everyday Workflow](#3-everyday-workflow)
4. [Remote Operations](#4-remote-operations)
5. [Stashing](#5-stashing)
6. [Undoing Changes](#6-undoing-changes)
7. [Viewing History](#7-viewing-history)
8. [Merging & Rebasing](#8-merging--rebasing)
9. [Troubleshooting: Pre-push Hook Failure](#9-troubleshooting-pre-push-hook-failure)

---

## 1. Setup

```bash
# One-time: install dependencies, golangci-lint, and wire up git hooks
make setup

# If git hooks are not running, re-link them manually
make setup-git
# This symlinks git/* → .git/hooks/ (pre-commit, pre-push)
```

---

## 2. Branches

```bash
# List all local branches
git branch

# List all branches (local + remote)
git branch -a

# Create a new branch from the current one
git checkout -b feature/my-new-feature

# Switch to an existing branch
git checkout dev-gs/phase1-authentication-changes

# Switch (modern syntax)
git switch dev-gs/phase1-authentication-changes

# Rename current branch
git branch -m new-name

# Delete a local branch (only if merged)
git branch -d feature/done

# Force-delete a local branch (even if not merged)
git branch -D feature/unneeded

# Delete a remote branch
git push origin --delete feature/old-branch
```

---

## 3. Everyday Workflow

```bash
# See what's changed
git status

# See the actual diff (unstaged changes)
git diff

# See staged diff (what will be committed)
git diff --staged

# Stage specific files
git add ui/src/layout/Logout.jsx
git add navidrome.toml

# Stage all changes
git add .

# Commit with a message
git commit -m "fix: redirect login button to Authentik outpost"

# Stage and commit in one step (tracked files only — won't add new files)
git commit -am "fix: update ReverseProxyWhitelist subnet"
```

---

## 4. Remote Operations

```bash
# Set upstream and push (first push of a new branch)
git push --set-upstream origin dev-gs/phase1-authentication-changes

# Push after upstream is set
git push

# Pull latest changes (fetch + merge)
git pull

# Pull with rebase instead of merge (cleaner history)
git pull --rebase

# Fetch all remote changes without merging
git fetch origin

# See all remotes
git remote -v
```

---

## 5. Stashing

```bash
# Save uncommitted changes to a temporary stash
git stash

# Save with a description
git stash push -m "WIP: Authentik proxy provider config"

# List all stashes
git stash list

# Apply the most recent stash (keeps it in the stash list)
git stash apply

# Apply and remove the most recent stash
git stash pop

# Apply a specific stash
git stash apply stash@{2}

# Drop a specific stash
git stash drop stash@{0}

# Clear all stashes
git stash clear
```

---

## 6. Undoing Changes

```bash
# Discard unstaged changes in a specific file
git checkout -- navidrome.toml

# Discard ALL unstaged changes (careful — irreversible)
git checkout -- .

# Unstage a file (keep the changes in working directory)
git restore --staged navidrome.toml

# Undo the last commit but keep the changes staged
git reset --soft HEAD~1

# Undo the last commit and unstage changes (changes stay in working dir)
git reset HEAD~1

# Undo the last commit and discard all changes (DESTRUCTIVE)
git reset --hard HEAD~1

# Revert a specific commit (creates a new undo-commit, safe for shared branches)
git revert <commit-hash>

# Revert the last commit
git revert HEAD
```

---

## 7. Viewing History

```bash
# Show commit log
git log

# Compact one-line log
git log --oneline

# Visual branch graph
git log --oneline --graph --all

# Show changes introduced by a specific commit
git show <commit-hash>

# Show who changed each line of a file
git blame ui/src/layout/Logout.jsx

# Search commit messages
git log --grep="Authentik"

# Show all commits that changed a specific file
git log --follow -- ui/src/authProvider.js
```

---

## 8. Merging & Rebasing

```bash
# Merge another branch into the current one
git merge dev-gs/phase-1-changes

# Rebase current branch onto another (cleaner than merge for feature branches)
git rebase main

# Abort an in-progress rebase
git rebase --abort

# Continue a rebase after resolving conflicts
git rebase --continue

# Squash the last 3 commits into one (interactive)
git rebase -i HEAD~3

# Cherry-pick a specific commit from another branch
git cherry-pick <commit-hash>
```

---

## 9. Troubleshooting: Pre-push Hook Failure

### The Problem

When running `git push`, the pre-push hook runs `make pre-push`, which runs `make lint`. If you see:

```
panic: file requires newer Go version go1.26 (application built with go1.24)
make: *** [lint] Error 2
error: failed to push some refs
```

**Root cause:** The local `./bin/golangci-lint` binary was built with an older Go version (e.g., go1.24) but your machine now runs a newer Go (e.g., go1.26). The linter's internal type-checker panics when it sees stdlib files that declare `//go:build go1.26`.

### Fix 1 — Update golangci-lint (Recommended)

Delete the old binary and reinstall it using your current Go version:

```bash
# Remove the old binary
rm ./bin/golangci-lint

# Reinstall (Makefile will auto-install the pinned version on next make lint)
make lint
```

If the Makefile's pinned version (`v2.1.6`) is still too old for your Go version, install the latest:

```bash
rm ./bin/golangci-lint
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/HEAD/install.sh \
  | sh -s -- -b ./bin latest
```

Verify it now works:

```bash
PATH=$PATH:./bin golangci-lint version
make lint
```

Then push normally:

```bash
git push --set-upstream origin dev-gs/phase1-authentication-changes
```

### Fix 2 — Skip the hook once (quick workaround)

If you need to push urgently and will fix the linter separately:

```bash
git push --no-verify --set-upstream origin dev-gs/phase1-authentication-changes
```

> **Note:** `--no-verify` skips ALL git hooks (pre-commit and pre-push). Use only as a one-time workaround — do not make it a habit, as it bypasses lint and test checks.

### Fix 3 — Bypass lint only via environment variable

Some Makefiles support skipping lint but running tests:

```bash
SKIP_LINT=true git push
```

> This only works if the Makefile checks for `SKIP_LINT`. In this repo, the `pre-push` target runs `make lintall testall` directly, so `--no-verify` is the only bypass option.

---

### Why the pre-push hook runs lint

The hook at `.git/hooks/pre-push` is symlinked from `git/pre-push` and runs:

```sh
make pre-push
```

Which resolves to:

```makefile
pre-push: lintall testall
```

So every push runs both Go + JS linting and the full test suite. This is intentional — it prevents broken code from reaching the remote.

To re-install hooks after cloning or if they stop working:

```bash
make setup-git
```
