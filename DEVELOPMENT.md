# Development Guide

## Quick Start Options

### Option 1: Traditional Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update DATABASE_URL in .env with your PostgreSQL credentials
# Example: postgresql://postgres:password@localhost:5432/wine_inventory

# Set up database schema
npm run db:push

# Start development server
npm run dev
```

### Option 2: Automated Setup

```bash
# Run the setup script
./setup-local.sh
```

### Option 3: Docker Setup

See "Run with Docker" in README.md (`docker compose up -d --build`, database stays on Supabase).

## Database Configuration

### Local PostgreSQL Setup

1. Install PostgreSQL on your system
2. Create a database named `wine_inventory`
3. Update the `DATABASE_URL` in your `.env` file:
   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/wine_inventory
   ```

### Using Docker PostgreSQL

```bash
# Start only PostgreSQL
docker run -d \
  --name wine-inventory-db \
  -e POSTGRES_DB=wine_inventory \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15

# Use this DATABASE_URL in your .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/wine_inventory
```

## Testing the Application

### Authentication

The application uses hardcoded authentication for development:

- Any email/password combination will work
- Login returns a mock user and token
- No actual user registration is required

### Sample Data Testing

#### Products

Test creating products with these sample entries:

```json
{
  "name": "Château Margaux 2019",
  "netVolume": "750ml",
  "vintage": "2019",
  "wineType": "Red",
  "sugarContent": "Dry",
  "appellation": "Margaux",
  "sku": "CM2019-001"
}
```

#### Ingredients

Test creating ingredients with these sample entries:

```json
{
  "name": "Sulfur Dioxide",
  "category": "Preservative",
  "eNumber": "E220",
  "allergens": ["Sulfites"],
  "details": "Antioxidant and preservative"
}
```

### API Testing with curl

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

#### Create Product

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Wine",
    "netVolume": "750ml",
    "vintage": "2020",
    "wineType": "Red",
    "sugarContent": "Dry",
    "appellation": "Bordeaux",
    "sku": "TW2020-001"
  }'
```

#### Get All Products

```bash
curl http://localhost:5000/api/products
```

## File Upload Testing

### Image Upload

```bash
# Upload an image for product ID 1
curl -X POST http://localhost:5000/api/products/1/image \
  -F "image=@/path/to/your/image.jpg"
```

### Excel Import

Create sample Excel files with these formats:

#### Products Excel (products.xlsx)

| Name           | Net Volume | Vintage | Type      | Sugar Content | Appellation | SKU        |
| -------------- | ---------- | ------- | --------- | ------------- | ----------- | ---------- |
| Bordeaux Rouge | 750ml      | 2020    | Red       | Dry           | Bordeaux    | BR2020-001 |
| Champagne Brut | 750ml      | 2019    | Sparkling | Brut          | Champagne   | CB2019-001 |

#### Ingredients Excel (ingredients.xlsx)

| Name              | Category         | E Number | Allergens | Details                  |
| ----------------- | ---------------- | -------- | --------- | ------------------------ |
| Potassium Sorbate | Preservative     | E202     | None      | Prevents fermentation    |
| Egg White         | Clarifying Agent |          | Eggs      | Traditional fining agent |

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Database operations
npm run db:push          # Push schema changes
npm run db:generate      # Generate migrations
npm run db:studio        # Open database GUI

# Code quality
npm run lint             # Run linting
npm run type-check       # TypeScript type checking
```

## Environment Variables Reference

| Variable          | Description                  | Default               | Required |
| ----------------- | ---------------------------- | --------------------- | -------- |
| DATABASE_URL      | PostgreSQL connection string | -                     | Yes      |
| JWT_SECRET        | Secret key for JWT tokens    | -                     | Yes      |
| EMAIL_USER        | Email for notifications      | mock@example.com      | No       |
| EMAIL_PASS        | Email password               | mock-password         | No       |
| BASE_URL          | Application base URL         | http://localhost:5000 | No       |
| SUPABASE_URL      | Supabase project URL         | -                     | No       |
| SUPABASE_ANON_KEY | Supabase anonymous key       | -                     | No       |
| NODE_ENV          | Environment mode             | development           | No       |

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)
```

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Ensure database exists
4. Test connection: `psql "postgresql://postgres:password@localhost:5432/wine_inventory"`

### File Upload Issues

1. Ensure `uploads/` directory exists
2. Check file permissions
3. Verify file size limits (5MB for images, 10MB for Excel)

### Excel Import Issues

1. Verify column headers match expected format
2. Check file encoding (UTF-8 recommended)
3. Ensure required fields are populated

## Development Features

### Hot Reload

The development server includes hot reload for:

- Frontend React components
- Backend Express routes
- TypeScript compilation

### Database GUI

Access Drizzle Studio for database management:

```bash
npm run db:studio
```

Opens at: http://localhost:4983

### File Structure for Development

```
├── client/src/
│   ├── components/ui/     # Reusable UI components
│   ├── components/forms/  # Form components
│   ├── components/tables/ # Table components
│   ├── pages/            # Application pages
│   └── lib/              # Utilities and configurations
├── server/
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database operations
│   └── auth.ts           # Authentication logic
├── shared/
│   └── schema.ts         # Database schemas and types
└── uploads/              # File upload directory
```
