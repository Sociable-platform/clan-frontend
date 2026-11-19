# Build and deployment

How Studio is built into an image and deployed, and how the shared `@clan/ui` package is published. Back to the [README](../README.md).

## Build and deploy

Studio ships as a container image: the built app served by nginx on port 8080 (`Dockerfile`, `deploy/nginx.conf`). `VITE_PLATFORM_URL` is baked into the JavaScript at build time.

| CI job (`.gitlab-ci.yml`) | When | What it does |
|---|---|---|
| `publish-ui` | `develop`, when `packages/ui` changed | tests `packages/ui` and publishes a new `@clan/ui` version for clan-sdk |
| `images` | `main` only (by hand on a merge request); nothing is built from `develop` | builds the Studio image for amd64 and arm64 and pushes `clan-frontend/studio:<short commit sha>` |
| `deploy` | `main` only, after `images` | deploys that image to the k3s server |

**Every merge to `main` is deployed.** `deploy/deploy.sh <tag>` copies the chart in `deploy/helm/studio` to the server over SSH and runs `helm upgrade --install clan-studio ... --set image.tag=<tag> --wait`; if the new pod is not ready within 5 minutes the deploy fails and the old pod keeps serving. Studio is its own Helm release (`clan-studio`) in the `clan` namespace, at `https://studio.130-61-158-79.sslip.io`, so a release needs no change in clan-backend. It reuses that chart's registry pull secret (`gitlab-registry`) and certificate issuer (`clan-letsencrypt`), so clan-backend must be installed first.

- The job needs the CI/CD variables `DEPLOY_SSH_KEY_B64` and `DEPLOY_SSH_KNOWN_HOSTS` (protected, the same two clan-backend and clan-sdk use), and `main` must be a protected branch.
- Which build runs, and rolling back: GitLab -> Operate -> Environments -> `studio-production`, where an older deploy can be run again.
- From a laptop (Git Bash): `bash deploy/deploy.sh <short commit sha>`, with your own SSH key.
