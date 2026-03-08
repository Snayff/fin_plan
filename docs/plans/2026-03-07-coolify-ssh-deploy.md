# Coolify SSH Deploy Fix

**Date:** 2026-03-07
**Status:** Approved

## Problem

The `Deploy to Coolify` CI job fails with `curl: (28)` (connection timeout) when pushing to `main`. The job calls `curl --fail "${{ secrets.COOLIFY_WEBHOOK_URL }}"` where the URL targets `http://95.146.81.51:8000/...`. Port 8000 is firewalled from external access (including GitHub Actions runners), so the connection never completes.

The Coolify instance is healthy and port 8000 is listening — the issue is purely network reachability from GitHub's infrastructure.

## Decision

Replace the direct curl webhook with an SSH-based trigger. GitHub Actions SSHs into the Coolify server and runs the curl command from inside the server, where port 8000 is accessible via localhost.

Alternatives considered:
- **Native Coolify Git integration** — rejected because GitHub still needs to reach Coolify via HTTP to send push webhooks, hitting the same firewall problem
- **Expose Coolify via Traefik subdomain** — rejected because it publicly exposes the Coolify API

## Design

```
Push to main
  → GitHub Actions (CI passes)
    → SSH into 95.146.81.51 as gabriel
      → curl http://localhost:8000/api/v1/deploy/TOKEN
        → Coolify deploys finplan
```

### Security hardening

The SSH key is restricted using a `command=` forced command in `authorized_keys`. This means:

- The key cannot open a shell — it can only trigger the specific curl command
- The Coolify deploy token lives only on the server, never in GitHub secrets
- Even if the private key leaks, an attacker can only trigger a Coolify deploy

The server's SSH host key is stored as a GitHub secret (`COOLIFY_HOST_KEY`) and used to populate `known_hosts`, preventing MITM attacks during key verification (avoids the insecure `ssh-keyscan` pattern).

### GitHub secrets required

| Secret | Value | Notes |
|---|---|---|
| `DEPLOY_SSH_KEY` | Private key (PEM) | New — generated for this purpose |
| `COOLIFY_HOST_KEY` | Server's SSH host key line | New — from `ssh-keyscan` verified locally |
| `COOLIFY_WEBHOOK_URL` | _(remove)_ | No longer needed — token moves to server |

### Server `authorized_keys` entry

```
command="curl --silent --show-error --fail 'http://localhost:8000/api/v1/deploy/TOKEN'",no-pty,no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-rsa AAAA...
```

### Updated deploy job (`ci.yml`)

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

## Implementation Steps

1. On your local machine, generate a dedicated SSH keypair:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/finplan_deploy -N ""
   ```

2. Capture the server's SSH host key (verify the fingerprint matches your server):
   ```bash
   ssh-keyscan 95.146.81.51
   ```

3. SSH into the Coolify server and add the restricted authorized_keys entry:
   ```bash
   ssh gabriel@95.146.81.51
   # On the server:
   echo 'command="curl --silent --show-error --fail '"'"'http://localhost:8000/api/v1/deploy/TOKEN'"'"'",no-pty,no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA...' >> ~/.ssh/authorized_keys
   ```
   Replace `TOKEN` with the actual deploy token from your Coolify webhook URL, and `AAAA...` with the public key content from `~/.ssh/finplan_deploy.pub`.

4. Test the restricted key from your local machine:
   ```bash
   ssh -i ~/.ssh/finplan_deploy gabriel@95.146.81.51
   # Should run the curl command and return — not open a shell
   ```

5. Add GitHub Actions secrets:
   - `DEPLOY_SSH_KEY` — contents of `~/.ssh/finplan_deploy` (private key)
   - `COOLIFY_HOST_KEY` — the relevant line from `ssh-keyscan` output (the `ecdsa-sha2-nistp256` or `ssh-ed25519` line)

6. Update `.github/workflows/ci.yml` — replace the deploy job steps as shown above.

7. Remove the `COOLIFY_WEBHOOK_URL` secret from GitHub (Settings → Secrets).

8. Push to `main` and verify the deploy job succeeds.
