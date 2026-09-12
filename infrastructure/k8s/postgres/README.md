# Postgres (Phase 8)

One Postgres instance for the whole cluster, matching docker-compose's approach -
`init-multiple-dbs.sh` creates all 6 service databases on first boot.

**Important:** the init script only runs against a genuinely empty data directory.
If you `kubectl delete` and recreate the Deployment without also deleting the PVC,
the databases from your previous run are still there (that's the point of the
PVC) - the script simply won't run again, and that's correct, not a bug.

Apply order matters here specifically: `pvc.yaml` and `configmap.yaml` before
`deployment.yaml`, though `kubectl apply -f infrastructure/k8s/postgres/` (applying
the whole folder at once) handles this fine - Kubernetes resolves volume/configmap
references at pod-start time, not apply time.
