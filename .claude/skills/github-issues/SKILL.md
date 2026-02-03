---
name: github-issues
description: Fetches open GitHub issues for the current repository using the gh CLI.
user_invocable: true
---

# GitHub Issues

Fetch and display open issues for the current repository.

## Instructions

1. Check if `gh` CLI is installed by running `which gh`. If not installed, inform the user they need to install it: https://cli.github.com

2. Run `gh issue list --state open --json number,title,body,labels,author,createdAt` to fetch all open issues.

3. Display the issues in a clear, readable format showing:
   - Issue number
   - Title
   - Body
   - Labels (if any)
   - Author
   - Created date

4. If there are no open issues, inform the user.
