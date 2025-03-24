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

## Enviroment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Azure Storage account name | `mystorageaccount` |
| `AZURE_STORAGE_ACCOUNT_KEY` | Azure Storage access key | `abcd1234...` |
| `AZURE_STORAGE_CONTAINER_NAME` | Azure Storage container name | `mycontainer` |
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_FROM` | Sender email address | `no-reply@yourapp.com` |
| `EMAIL_PASSWORD` | SMTP password | `your-app-specific-password` |
| `NEXT_PUBLIC_APP_URL` | Public URL of your application (in development, defaults to http://localhost:3000) | `https://example.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_SECURE` | Use SSL/TLS | `true` |