# Coolify SSH Deploy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the failing `Deploy to Coolify` CI job by replacing the direct curl webhook (blocked by firewall) with an SSH-based trigger that runs curl from inside the server.

**Architecture:** GitHub Actions SSHs into the Coolify server using a restricted deploy key. The key is locked to a single forced command in `authorized_keys` — it cannot open a shell, only trigger the Coolify webhook from localhost. The deploy token lives only on the server, never in GitHub secrets.

**Tech Stack:** SSH (ed25519), GitHub Actions secrets, Coolify webhook API, bash

---

> **Note:** Tasks 1–3 are manual steps performed on your local machine and the Coolify server. Task 4 is a code change to the repository. Task 5 is verification.

---

### Task 1: Generate the deploy SSH keypair

Performed on your **local machine** (not the server, not in the repo).

**Step 1: Generate the keypair**

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/finplan_deploy -N ""
```

Expected output:
```
Generating public/private ed25519 key pair.
Your identification has been saved in /home/you/.ssh/finplan_deploy
Your public key has been saved in /home/you/.ssh/finplan_deploy.pub
```

**Step 2: Print the public key — you will need this in Task 2**

```bash
cat ~/.ssh/finplan_deploy.pub
```

Copy the full output (starts with `ssh-ed25519 AAAA...`).

**Step 3: Print the private key — you will need this in Task 3**

```bash
cat ~/.ssh/finplan_deploy
```

Copy the full output (starts with `-----BEGIN OPENSSH PRIVATE KEY-----`). Keep this safe.

---

### Task 2: Configure the server

Performed on the **Coolify server** via SSH as `gabriel`.

**Step 1: Get the Coolify deploy token**

You need the token from the existing `COOLIFY_WEBHOOK_URL` secret. It looks like:
`http://95.146.81.51:8000/api/v1/deploy/SOME_TOKEN_HERE`

Copy `SOME_TOKEN_HERE` — you will embed it in the forced command below.

**Step 2: SSH into the server**

```bash
ssh gabriel@95.146.81.51
```

**Step 3: Add the restricted authorized_keys entry**

Run this on the server, replacing:
- `SOME_TOKEN_HERE` with the token from Step 1
- `ssh-ed25519 AAAA...` with the full public key from Task 1 Step 2

```bash
echo 'command="curl --silent --show-error --fail '"'"'http://localhost:8000/api/v1/deploy/SOME_TOKEN_HERE'"'"'",no-pty,no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA...' >> ~/.ssh/authorized_keys
```

**Step 4: Verify the entry was added correctly**

```bash
tail -1 ~/.ssh/authorized_keys
```

Expected: the line starts with `command="curl` and ends with your public key. Confirm the token and public key are correct.

**Step 5: Exit the server**

```bash
exit
```

---

### Task 3: Capture the server host key and add GitHub secrets

Performed on your **local machine**.

**Step 1: Capture the server's SSH host key**

```bash
ssh-keyscan 95.146.81.51
```

This outputs several lines. Copy the line that starts with `95.146.81.51 ssh-ed25519` (preferred) or `95.146.81.51 ecdsa-sha2-nistp256`.

**Step 2: Verify the fingerprint matches**

```bash
ssh-keyscan 95.146.81.51 | ssh-keygen -lf -
```

Cross-check this fingerprint against the one you see when you normally SSH in (or confirm it via a known-good connection). This ensures you're not capturing a spoofed key.

**Step 3: Test the restricted key from your local machine**

```bash
ssh -i ~/.ssh/finplan_deploy gabriel@95.146.81.51
```

Expected: The command runs `curl` on the server and exits — it does NOT open a shell. You may see a Coolify API response or just a clean exit. You should NOT get a bash prompt.

If you get a shell prompt, the `authorized_keys` entry is wrong — go back to Task 2 and fix it before continuing.

**Step 4: Add GitHub secret — `DEPLOY_SSH_KEY`**

Go to: GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret

- Name: `DEPLOY_SSH_KEY`
- Value: full contents of `~/.ssh/finplan_deploy` (the private key, including the `-----BEGIN` and `-----END` lines)

**Step 5: Add GitHub secret — `COOLIFY_HOST_KEY`**

- Name: `COOLIFY_HOST_KEY`
- Value: the single host key line captured in Step 1 (e.g. `95.146.81.51 ssh-ed25519 AAAA...`)

**Step 6: Remove the old secret — `COOLIFY_WEBHOOK_URL`**

Go to: GitHub → your repo → Settings → Secrets and variables → Actions

Find `COOLIFY_WEBHOOK_URL` and delete it. The token now lives only on the server.

---

### Task 4: Update ci.yml

**Files:**
- Modify: `.github/workflows/ci.yml:185-187`

**Step 1: Replace the deploy job steps**

Current content (lines 185–187):
```yaml
    steps:
      - name: Trigger Coolify deploy
        run: curl --fail "${{ secrets.COOLIFY_WEBHOOK_URL }}"
```

Replace with:
```yaml
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

**Step 2: Verify the full deploy job looks correct**

The complete deploy job should be:
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

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "fix(ci): trigger Coolify deploy via SSH instead of direct curl"
```

---

### Task 5: Verify

**Step 1: Push to main**

```bash
git push origin main
```

(Or merge a PR to main if working on a branch.)

**Step 2: Watch the CI run**

Go to: GitHub → your repo → Actions → the latest run

Confirm:
- The `Deploy to Coolify` job appears
- The `Set up SSH` step completes successfully
- The `Trigger Coolify deploy` step completes successfully (exit code 0)
- No `curl: (28)` timeout error

**Step 3: Confirm the deploy happened in Coolify**

Open the Coolify dashboard locally and check the deployment log for the finplan application. Confirm a new deployment was triggered at the time of the CI run.
