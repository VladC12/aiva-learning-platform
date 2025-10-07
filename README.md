## Description

This learning platform leverages AI-generated content to provide a streamlined and engaging educational experience. Students can practice exercises aligned with the curriculum, track their progress, and reinforce their understanding efficiently.

For educators, the platform offers powerful tools to manage student groups, monitor individual and class-wide performance, and easily create exam papers through an intuitive question management interface.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation

Additional documentation can be found in the [docs](./docs) directory:

- [Architecture Overview](./docs/architecture-overview.md) - Mermaind powered documentation of the platform overall.

- [User Activity Tracking](./docs/user-activity-tracking.md) - Information about the user activity tracking system.

## Enviroment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Azure Storage account name | `mystorageaccount` |
| `AZURE_STORAGE_ACCOUNT_KEY` | Azure Storage access key | `abcd1234...` |
| `AZURE_STORAGE_CONTAINER_NAME` | Azure Storage container name | `mycontainer` |
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_USER` | Sender user for logging in SMPT server | `no-reply@yourapp.com` |
| `EMAIL_FROM` | Sender email address | `no-reply@yourapp.com` |
| `EMAIL_PASSWORD` | SMTP App password | `your-app-specific-password` |
| `NEXT_PUBLIC_APP_URL` | Public URL of your application (in development, defaults to http://localhost:3000) | `https://example.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_SECURE` | Use SSL/TLS | `true` |
| `NEXT_PUBLIC_FREE_FORM_LIMIT` | Question paper limit in free form mode | `100` |