# Oracle Cloud provisioning + recovery runbook

Per ADR-0004. Takes the site from "nothing" to "live on Oracle Always Free",
restoring the 23 Oct 2026 database and the media already in R2.

Most steps work from a phone. **Step 6 (database restore) needs a machine
with `psql`** — budget ten minutes at a computer for that one.

---

## 1. Signup

Go to **signup.oraclecloud.com**. Note that Oracle presents this as a
30-day free trial *with credits*; Always Free is what remains once the
trial lapses. That is the normal route in — you are not signing up for
the wrong thing.

1. **Country and name**, then an email. Oracle allows **one cloud account
   per email address**, so pick the one you want permanently. Complete the
   CAPTCHA and choose "Verify my email".
2. **Verify the email.** Subject line "Confirm your Oracle cloud account".
   The link **expires in 30 minutes** — if you miss that window, restart.
3. **Password.** 8–40 characters, needing a lowercase, an uppercase, a
   number and a special character. It cannot contain your first name, last
   name or email, spaces, or any of `` ` ~ < > \ ``.
4. **Cloud account name** (identifies the tenancy) and, optionally, a
   company name.
5. **Home region — this is the one irreversible choice.** It cannot be
   changed after signup, and Always Free compute *and* block volumes must
   live in it. Volumes created elsewhere are billed normally.
6. Accept the Terms of Use, then enter **address and phone number**.
7. **Payment verification** → "Credit Card". Oracle accepts debit cards
   carrying a Visa, Mastercard, Discover or Amex logo **provided they do
   not require a PIN**. Expect a small temporary verification hold, removed
   automatically; Oracle states the card is not charged unless you
   explicitly upgrade to a paid account. No hold amount is published.
8. Accept terms, "Start my free trial", and you land in the OCI Console.

**Choosing the home region.** ARM capacity varies enormously by region and
this choice is permanent, so weigh it properly. Heavily contested regions
(Frankfurt, London, Ashburn, Phoenix) are where "Out of host capacity" is
worst. Latency to Nigeria barely matters here because Cloudflare fronts the
origin — so optimise for capacity, not proximity.

**If the card is rejected.** Common and usually not your fault:

- Use a virtual USD card from a Nigerian fintech; it must support
  international transactions and not require a PIN
- The cardholder name should match the account name
- **Do not sign up over a VPN** — it reliably trips fraud detection
- Oracle's docs note that in some countries online signup is unavailable
  and you must contact Oracle Sales. Nigeria is not named either way, so
  if you're repeatedly blocked with a vague error, that's the escalation
  path rather than endless retries

## 2. Provision the AMD micro instance

Compute → Instances → Create. Per **ADR-0005** we use the AMD shape, because ARM A1 capacity proved
unobtainable in the home region.

| Setting | Value |
|---|---|
| Shape | `VM.Standard.E2.1.Micro` (AMD, x86_64) |
| OCPUs / Memory | 1 / 1 GB — fixed for this shape |
| Image | Ubuntu 22.04 or 24.04 (**x86_64**, not ARM) |
| Boot volume | 50 GB default (200 GB free total, shared with block volumes) |
| SSH key | Upload one, or let Oracle generate and **download it** |

Always Free includes **two** of these. Provision one now; the second is
the escape hatch for moving Postgres off the box if memory gets tight.

If you still see **"Out of host capacity"** on this shape too, try a
different availability domain within your region. The AMD micro is far
more widely available than ARM A1, so this is unlikely.

**Guard against idle reclamation.** Oracle may reclaim an Always Free
instance that, over 7 days, shows 95th-percentile CPU under 20%, network
under 20% and memory under 20%. A quiet news site can hit all three. The
uptime monitoring in step 9 is the mitigation — treat it as required.

## 2b. Add swap — do this before deploying

1 GB is tight. Expected steady state is roughly 250–400 MB app, 50–100 MB
Postgres, 20 MB Caddy and 100–200 MB host. Swap is **required**, not
optional, and block storage is free up to 200 GB:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

Lower the swappiness so the kernel prefers RAM but still has the cushion:

```bash
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf
sudo sysctl --system
```

## 3. Open the firewall — **both** layers

This is the gotcha that wastes an afternoon. Oracle filters traffic in two
independent places and opening one is not enough.

**a) Security List** (VCN → Subnet → Security List → Add Ingress Rules):

| Source | Protocol | Dest. port |
|---|---|---|
| `0.0.0.0/0` | TCP | 80 |
| `0.0.0.0/0` | TCP | 443 |

**b) The instance's own iptables.** Oracle's Ubuntu images ship with
pre-populated rules that drop everything except SSH, *regardless of your
Security List*. On the box:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

If the site is unreachable but `docker ps` shows Caddy running and healthy,
it is almost always this.

## 4. Install Docker

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg unzip
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER" && newgrp docker
```

AWS CLI v2 (the backup and restore scripts need it; Ubuntu's `awscli` apt
package is v1 on 22.04 and absent on 24.04):

```bash
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp && sudo /tmp/aws/install && rm -rf /tmp/aws /tmp/awscliv2.zip
aws --version   # aws-cli/2.x
```

## 5. Clone and configure

```bash
git clone https://github.com/endrissuofe/Karacternews.git karacter
cd karacter
cp .env.example .env
nano .env
```

Fill in `.env`. None of these survive on the old box, so regenerate:

| Var | Where it comes from |
|---|---|
| `POSTGRES_PASSWORD` | new random string |
| `PAYLOAD_SECRET` | new random string (`openssl rand -hex 32`) |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare → R2 → Manage API Tokens (new token) |
| `R2_BUCKET` / `R2_ENDPOINT` | existing bucket + `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `REQUIRE_R2` | `true` — **set this**, it prevents silent local-disk fallback |
| `BACKUP_HEALTHCHECK_URL` | healthchecks.io ping URL (step 9) |
| `RESTORE_TEST_HEALTHCHECK_URL` | second healthchecks.io check, ~32-day period (step 9) |
| `CRON_SECRET` / `PREVIEW_SECRET` | new random strings |
| `BREVO_API_KEY` / `BREVO_LIST_ID` | Brevo dashboard |
| `NEXT_PUBLIC_SERVER_URL` | `https://karaktermedia.com` |
| `SITE_DOMAIN` | `karaktermedia.com` |

> Changing `PAYLOAD_SECRET` invalidates existing admin sessions — everyone
> logs in again. Password hashes are unaffected, so accounts still work.

## 6. Restore the database

Start Postgres alone, then load the dump **before** the app starts:

```bash
docker compose -f infra/docker-compose.micro.yml --env-file .env up -d postgres

# Load .env into this shell so the R2 variables below are set
set -a && source .env && set +a

# Pull the dump from R2 (aws cli installed in step 4)
AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws s3 cp "s3://$R2_BUCKET/backups/karacter-20261023-021501.sql.gz" . \
  --endpoint-url "$R2_ENDPOINT" --region auto

gunzip -c karacter-20261023-021501.sql.gz \
  | docker compose -f infra/docker-compose.micro.yml --env-file .env \
      exec -T postgres psql -U karacter -d karacter
```

Sanity check before continuing — this should print roughly 30:

```bash
docker compose -f infra/docker-compose.micro.yml --env-file .env \
  exec -T postgres psql -U karacter -d karacter \
  -c "select count(*) from articles where status = 'published';"
```

## 7. Deploy

**Prerequisite: the image must exist.** CI builds and pushes it on push to
`main`, so merge your branch to `main` first and let the `publish-image`
job finish. Check the Actions tab — without a published image there is
nothing to pull.

```bash
bash infra/scripts/deploy-micro.sh
```

This pulls the prebuilt image, starts Postgres, then brings up the app and
Caddy. It **never builds** — `next build` does not fit in 1 GB, which is
the whole reason CI builds it (ADR-0005).

No `--migrate` on a fresh restore: the dump you just loaded already carries
the schema. You only need `bash infra/scripts/deploy-micro.sh --migrate`
when `src/migrations` has changed.

If the pull fails with a permissions error, the GHCR package is private.
Either set the package to public in GitHub (the image contains no secrets
— the Dockerfile's `runner` stage copies only build output, and CI builds
with throwaway credentials), or log the box in with a read-only token:

```bash
echo "<github-pat-with-read:packages>" | docker login ghcr.io -u <username> --password-stdin
```

**Rolling back** is a tag change, which is a side benefit of CI builds:

```bash
IMAGE=ghcr.io/endrissuofe/karacternews:<commit-sha> \
  docker compose -f infra/docker-compose.micro.yml --env-file .env up -d app
```

## 8. DNS cutover

Cloudflare → DNS → the `karaktermedia.com` A record → change the IP to the
Oracle instance's public IP. Keep it **proxied** (orange cloud) and TLS at
**Full (strict)**, matching the previous setup.

Caddy will issue a fresh Let's Encrypt certificate on first request. If it
can't, port 80 is almost certainly blocked — revisit step 3b.

If ports are open but `docker compose -f infra/docker-compose.micro.yml logs caddy`
still shows the ACME challenge failing, switch the A record to **DNS only**
(grey cloud) for a few minutes, let Caddy issue the certificate, then switch it
back to proxied. The site is down anyway during a first cutover, so this costs
nothing.

## 9. Close the gaps that caused the 19-day outage

Do not skip this. It is the actual lesson of the incident.

**Backup alerting** — healthchecks.io (free): create a check with a ~26h
period, put its ping URL in `BACKUP_HEALTHCHECK_URL`, then install the
cron:

```bash
crontab -e
```

Add both lines. Cron's default `PATH` omits `/usr/local/bin`, where AWS CLI
v2 lives, and a normal user cannot write to `/var/log` — either mistake
stops the job from ever running:

```
PATH=/usr/local/bin:/usr/bin:/bin
15 2 * * * cd $HOME/karacter && bash infra/scripts/backup.sh >> $HOME/karacter-backup.log 2>&1
```

Run it once by hand (`bash infra/scripts/backup.sh`) and confirm the check
turns green in healthchecks.io before relying on it.

**Uptime monitoring** — UptimeRobot or Better Stack (free), 5-minute checks
on `https://karaktermedia.com/`. This is what turns a 19-day outage into a
same-day email, and the regular traffic also reduces Oracle's
idle-reclamation risk.

**Restore test** — CLAUDE.md §3.5 requires this monthly. Use
`infra/scripts/restore-test.sh`. It was never run; that is why nobody knew
the backup state during the incident. Run it once after the first nightly
backup, then schedule it (first of the month, 03:00, after the backup):

```
0 3 1 * * cd $HOME/karacter && bash infra/scripts/restore-test.sh >> $HOME/karacter-restore-test.log 2>&1
```

## 10. Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://karaktermedia.com/
curl -s https://karaktermedia.com/sitemap.xml | grep -c "<loc>"
```

The first should be `200`. The second should be **~35**, not 9 — the
sitemap revalidation fix means all published articles now appear. If it's
still 9, the deploy didn't pick up the fix.

Then submit `sitemap.xml` and `news-sitemap.xml` in Google Search Console,
and apply to Google News Publisher Center. Until that happens Google has
only ever seen four placeholder articles.
