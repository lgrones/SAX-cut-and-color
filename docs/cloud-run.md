# Cloud Run setup

One-time setup for the `web` service that renders the pages, admin and
`/api`. Firebase Hosting rewrites every non-static path to it (see
`firebase.json`). Run everything once, before the first `pnpm release`.

```sh
PROJECT=sax-cut-and-color
REGION=europe-west1
RUNTIME_SA=807779129066-compute@developer.gserviceaccount.com
CI_SA=<client_email of the FIREBASE_SERVICE_ACCOUNT_SAX_CUT_AND_COLOR GitHub secret>
```

## 1. Enable the APIs

```sh
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com --project $PROJECT
```

## 2. Store the Firebase credentials

The server reads them at runtime through `astro:env`. Take the values from `.env`.

```sh
for name in PROJECT_ID CLIENT_EMAIL PRIVATE_KEY; do
  printf '%s' "<value of $name>" | gcloud secrets create $name --data-file=- --project $PROJECT
  gcloud secrets add-iam-policy-binding $name --project $PROJECT \
    --member serviceAccount:$RUNTIME_SA --role roles/secretmanager.secretAccessor
done
```

To rotate one later, add a new version: `gcloud secrets versions add <name> --data-file=-`,
then redeploy so Cloud Run picks up `latest`.

## 3. Let CI deploy

```sh
for role in roles/run.admin roles/cloudbuild.builds.editor \
  roles/artifactregistry.writer roles/iam.serviceAccountUser roles/storage.admin; do
  gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:$CI_SA --role $role
done
```

`storage.admin` covers the bucket `gcloud run deploy --source` uploads the source to.

## 4. First deploy

```sh
pnpm release
```

This creates the `cloud-run-source-deploy` image repository on the first run.

## 5. Clean up old images

Every deploy pushes an image to Artifact Registry, which bills storage above
0.5 GB. Keep the three newest, delete the rest:

```sh
cat > /tmp/cleanup-policy.json <<'EOF'
[
  { "name": "keep-recent", "action": { "type": "Keep" }, "mostRecentVersions": { "keepCount": 3 } },
  { "name": "delete-rest", "action": { "type": "Delete" }, "condition": { "tagState": "any" } }
]
EOF
gcloud artifacts repositories set-cleanup-policies cloud-run-source-deploy \
  --project $PROJECT --location $REGION --policy /tmp/cleanup-policy.json --no-dry-run
```

Keep rules win over delete rules, so the newest three always survive.

## 6. Remove the webframeworks function

The old setup deployed the server as a Cloud Function (`ssr…`). Once the site
works through Cloud Run, delete it:

```sh
gcloud functions list --project $PROJECT
gcloud functions delete <name> --region $REGION --project $PROJECT
```
