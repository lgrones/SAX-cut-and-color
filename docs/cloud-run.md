# Cloud Run setup

One-time setup for the `web` service that renders the pages, admin and
`/api`. Firebase Hosting rewrites every non-static path to it (see
`firebase.json`). Run everything once, before the first `pnpm release`.

```sh
PROJECT=sax-cut-and-color
REGION=europe-west1
RUNTIME_SA=web-runtime@$PROJECT.iam.gserviceaccount.com
CI_SA=<client_email of the FIREBASE_SERVICE_ACCOUNT_SAX_CUT_AND_COLOR GitHub secret>
```

## 1. Enable the APIs

```sh
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com --project $PROJECT
```

## 2. Create the runtime service account

The server runs as its own service account, and the Admin SDK uses it
directly, so there is no key to store. It may only touch Firestore, the
image bucket and Firebase Auth (sessions and revoking them).

```sh
gcloud iam service-accounts create web-runtime --project $PROJECT
for role in roles/datastore.user roles/firebaseauth.admin; do
  gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:$RUNTIME_SA --role $role
done
gcloud storage buckets add-iam-policy-binding gs://$PROJECT.appspot.com \
  --member serviceAccount:$RUNTIME_SA --role roles/storage.objectAdmin
```

## 3. Let CI deploy

```sh
for role in roles/run.admin roles/cloudbuild.builds.editor \
  roles/artifactregistry.writer roles/iam.serviceAccountUser roles/storage.admin; do
  gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:$CI_SA --role $role
done
```

`storage.admin` covers the bucket `gcloud run deploy --source` uploads the source to.
`iam.serviceAccountUser` lets CI deploy the service to run as `$RUNTIME_SA`.

CI also deploys `firestore.rules` and `storage.rules` (`pnpm release:rules`),
which needs three more roles:

```sh
for role in roles/firebaserules.admin roles/firebasestorage.viewer \
  roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:$CI_SA --role $role
done
```

- `firebaserules.admin` creates and releases the rulesets.
- `firebasestorage.viewer` lets the CLI look up the default bucket the storage
  rules apply to.
- `serviceUsageConsumer` lets the CLI check that the Firestore and Storage APIs
  are enabled before it deploys.

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

## 7. Restrict the browser API key

The key in `src/services/firebaseClient/app.ts` is public by design. The
browser only uses it to sign in to the admin, so limit it to Firebase Auth and
the site's domains (dev signs in against the emulator, which ignores the key):

```sh
gcloud services api-keys list --project $PROJECT
gcloud services api-keys update <name> --project $PROJECT \
  --api-target service=identitytoolkit.googleapis.com \
  --api-target service=securetoken.googleapis.com \
  --allowed-referrers 'https://www.sax-cut-and-colour.at/*,https://sax-cut-and-color.web.app/*,https://sax-cut-and-color.firebaseapp.com/*'
```
