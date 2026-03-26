# Deployment Architecture

## Overview

Finplan deploys to a self-hosted Coolify instance at `95.146.81.51` via GitHub Actions. Deployments are triggered automatically on push to `main` after CI passes.

## Why SSH, Not Direct Webhook

Coolify's webhook API runs on port 8000, which is firewalled from external access. GitHub Actions runners cannot reach it directly — a `curl --fail "$COOLIFY_WEBHOOK_URL"` call will timeout with `curl: (28)`.

**Solution:** GitHub Actions SSHs into the server and runs the `curl` command from inside — where port 8000 is accessible via `localhost`.

```
Push to main
  → GitHub Actions (CI passes)
    → SSH into 95.146.81.51 as gabriel
      → curl http://localhost:8000/api/v1/deploy/TOKEN
        → Coolify deploys finplan
```

## Security Design

The deploy SSH key is restricted using a `command=` forced command in `authorized_keys`:

```
command="curl --silent --show-error --fail 'http://localhost:8000/api/v1/deploy/TOKEN'",no-pty,no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA...
```

This means:

- The key **cannot open a shell** — it can only trigger the one specific curl command
- The Coolify deploy token lives only on the server, never in GitHub secrets
- Even if the private key leaks, an attacker can only trigger a Coolify redeploy

The server's SSH host key is stored in `COOLIFY_HOST_KEY` and written to `known_hosts` before connecting, preventing MITM attacks.

## GitHub Secrets

| Secret             | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `DEPLOY_SSH_KEY`   | Private key (ed25519) for the restricted deploy user |
| `COOLIFY_HOST_KEY` | Server SSH host key line — written to `known_hosts`  |

## CI Workflow (`ci.yml` deploy job)

```yaml
deploy:
  name: Deploy to Coolify
  runs-on: ubuntu-latest
  if: github.event_name == 'push'
  environment: PROD

  steps:
    - name: Set up SSH
      run: |
        mkdir -p ~/.ssh
        echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/deploy_key
        chmod 600 ~/.ssh/deploy_key
        echo "${{ secrets.COOLIFY_HOST_KEY }}" >> ~/.ssh/known_hosts

    - name: Trigger Coolify deploy
      run: ssh -i ~/.ssh/deploy_key -o ConnectTimeout=10 gabriel@95.146.81.51
```

## If You Need to Rotate the Key

1. Generate a new ed25519 keypair locally
2. SSH into the server and replace the relevant line in `~/.ssh/authorized_keys` (keep the `command=` prefix — only replace the key material)
3. Update `DEPLOY_SSH_KEY` in GitHub secrets
4. Verify with a test push
