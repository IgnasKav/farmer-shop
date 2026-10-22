# Farmer commerce: local database

The [Compose file](compose.yaml) runs PostgreSQL 15 using the official image, matching the major version in [Medusa's Docker setup guide](https://docs.medusajs.com/learn/installation/docker). No custom image build is required.

## Start PostgreSQL

Start Docker Desktop with Linux containers enabled, then run these commands from this folder:

```powershell
docker compose up -d --wait postgres
docker compose ps
```

The database is available only on the local machine at `127.0.0.1:5432`. Default development credentials:

| Setting | Value |
| --- | --- |
| Database | `medusa` |
| User | `medusa` |
| Password | `medusa_local_dev` |

Set this in the Medusa backend's `.env` when the application is created:

```dotenv
DATABASE_URL=postgres://medusa:medusa_local_dev@127.0.0.1:5432/medusa
```

Run Medusa's migrations separately to create its application tables. This container creates the database, not the Medusa schema or product seed.

If Medusa is later containerised on the same Compose network, use `postgres:5432` instead of `127.0.0.1:5432` in its connection URL. The Nuxt storefront connects to Medusa, not directly to PostgreSQL.

## pgAdmin

Start the browser-based database manager (also starts PostgreSQL if needed):

```powershell
docker compose up -d pgadmin
```

Open http://127.0.0.1:5050 and sign in with `admin@example.com` / `pgadmin_local_dev`.
Register a server with any name and these connection settings:

| Setting | Value |
| --- | --- |
| Host name/address | `postgres` |
| Port | `5432` |
| Maintenance database | `medusa` |
| Username | `medusa` |
| Password | `medusa_local_dev` |

Use your PostgreSQL overrides if you changed the database credentials. pgAdmin connects over the Compose network, so its host is `postgres` and its port stays `5432` even when `POSTGRES_PORT` changes.

Set `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`, or `PGADMIN_PORT` in your environment to override the local development defaults. The login credentials initialise the account on first launch; changing these variables does not update an existing account. Settings and saved server connections persist in the `pgadmin_data` volume.

The service uses the official [pgAdmin container](https://www.pgadmin.org/docs/pgadmin4/latest/container_deployment.html).

## Verify and stop

```powershell
docker compose exec postgres psql -U medusa -d medusa -c "SELECT current_database(), version();"
docker compose logs --tail 50 postgres
docker compose down
```

Data remains in the named `postgres_data` volume after containers stop or are recreated. `docker compose down --volumes` deletes that data; it is not part of normal shutdown.

## Configuration

Compose accepts `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT` overrides from your environment. For example, if port 5432 is occupied:

```powershell
$env:POSTGRES_PORT = "5433"
docker compose up -d --wait postgres
```

Update the port in Medusa's `DATABASE_URL` accordingly. If changing credentials, update the connection URL too and URL-encode any special characters in credentials.

The image applies database/user/password initialisation settings only when the data volume is empty. Changing environment variables does not change credentials in an existing database. The defaults here are for local development.

## Project plans

- [Feature 001: initial setup and 10,000-product catalog](feature-001-initial-setup.md)
- [Platform plan](hosted-commerce-platform.html)
- [Lithuanian farmer pilot](lithuanian-farmers-pilot.html)
