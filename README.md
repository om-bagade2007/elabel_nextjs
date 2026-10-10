# Wine  Label Management System (React)

A full-stack web application for managing wine products and ingredients with import/export functionality.

## Features

- **Product Management**: Create, edit, delete wine products with detailed information
- **Ingredient Management**: Manage ingredients with allergen tracking
- **Image Upload**: Upload and manage product images
- **Excel Import/Export**: Bulk import/export products and ingredients via Excel files
- **Authentication**: User login and registration system
- **Responsive Design**: Modern UI built with React and Tailwind CSS

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Authentication**: Supabase Auth
- **File Upload**: Multer for image handling
- **Excel Processing**: XLSX library for import/export

## Run with Docker (deployment)

The app runs as one container; the database and login stay on Supabase.

1. `cp .env.example .env` and fill it in. Two values matter most:
   - `DATABASE_URL`: use the **Session pooler** string from Supabase → *Connect* → *Session pooler*
     (`postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`).
     The direct `db.<ref>.supabase.co` host is IPv6-only, and Docker cannot reach it. This is what
     broke Docker/localhost before.
   - `BASE_URL`: the address phones can open (e.g. `http://192.168.1.20:5000` or your domain).
     Printed QR codes point here.
2. Run both migrations once in the Supabase SQL editor (both are safe to re-run):
   `server/db/add_manufacturing_columns.sql` and `server/db/add_ingredients_and_scans.sql`.
3. Start it:
   ```bash
   docker compose up -d --build
   curl http://localhost:5000/api/health   # {"status":"ok"}
   ```
   Uploaded images live in the `uploads` Docker volume. Update after a `git pull` with the same command.

### Wine label and QR code
Each product page shows a 100 × 120 mm SVG back label (standard 750 ml bottle) filled from the
product form. Empty fields stay blank. The DPP QR code sits at a fixed spot bottom-right (25 mm) and
opens `BASE_URL/qr/product/<id>`. Use **Download label (SVG)** for print; pictograms are embedded.

### QR scan locations → QGIS
- When a shopper scans the QR, the public page asks the browser for location (they can decline).
- Other tools (e.g. the Python QR tool) can post scans directly:
  ```bash
  curl -X POST $BASE_URL/api/public/scans -H 'Content-Type: application/json' \
    -d '{"productId": 1, "lat": 18.5204, "lng": 73.8567, "source": "python-qr-tool"}'
  ```
- Set `SCANS_EXPORT_KEY` in `.env`, then in QGIS: *Layer → Add Layer → Add Vector Layer →
  Protocol: HTTP(S)* with URI `$BASE_URL/api/scans.geojson?key=<SCANS_EXPORT_KEY>`. Add an
  OpenStreetMap XYZ basemap underneath. Reload the layer to see new scans.

## Local Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Supabase account (for database and authentication)
- npm or yarn package manager
- Sentry account (optional, for error monitoring)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd elabel_nextjs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update the environment variables with your settings:

   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/wine_inventory
   JWT_SECRET=your-secret-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   BASE_URL=http://localhost:5000

   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_supabase_public_anon_key

   # Frontend Environment Variables
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_key

   # Sentry Configuration (Optional)
   VITE_SENTRY_DSN=https://your-public-key@your-org-id.ingest.sentry.io/project-id
   SENTRY_AUTH_TOKEN=your_sentry_auth_token_here

   # Node Environment
   NODE_ENV=development
   ```

4. **Database Setup**
   - Set up your Supabase project and get the connection details
   - Update the `DATABASE_URL` in `.env` file with your database credentials

5. **Database Migration**

   ```bash
   npm run db:push
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests (Playwright)

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── forms/      # Form components
│   │   │   ├── layout/     # Layout components
│   │   │   ├── modals/     # Modal components
│   │   │   ├── tables/     # Table components
│   │   │   └── ui/         # Base UI components (Radix UI)
│   │   ├── pages/          # Application pages
│   │   ├── lib/            # Utilities and configurations
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript type definitions
├── server/                 # Backend Express application
│   ├── auth.ts            # Authentication logic
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── index.ts           # Server entry point
│   ├── production.ts      # Production server configuration
│   ├── vite.ts            # Vite integration
│   └── db/                # Database setup and migrations
├── shared/                 # Shared types and schemas
│   ├── schema.ts          # Database schema definitions
│   └── supabase.ts        # Supabase configuration
├── tests/                  # Playwright tests
├── tests-examples/         # Test examples
├── uploads/               # File upload directory
└── Configuration files
    ├── components.json     # UI components configuration
    ├── drizzle.config.ts   # Database configuration
    ├── playwright.config.ts # Testing configuration
    ├── tailwind.config.ts  # Tailwind CSS configuration
    └── vite.config.ts      # Vite configuration
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/confirm-email` - Email confirmation

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/image` - Upload product image
- `DELETE /api/products/:id/image` - Delete product image
- `GET /api/products/export` - Export products to Excel
- `POST /api/products/import` - Import products from Excel

### Ingredients

- `GET /api/ingredients` - Get all ingredients
- `GET /api/ingredients/:id` - Get single ingredient
- `POST /api/ingredients` - Create new ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient
- `GET /api/ingredients/export` - Export ingredients to Excel
- `POST /api/ingredients/import` - Import ingredients from Excel

## Database Schema

### Products Table

- `id` - Primary key
- `name` - Product name
- `brand` - Brand name (optional)
- `netVolume` - Volume information
- `vintage` - Wine vintage year
- `wineType` - Type of wine
- `sugarContent` - Sugar content level
- `appellation` - Wine appellation
- `alcoholContent` - Alcohol percentage
- `packagingGases` - Packaging gases used
- `portionSize` - Serving portion size
- `kcal` - Calories per portion
- `kj` - Kilojoules per portion
- `fat` - Fat content
- `carbohydrates` - Carbohydrate content
- `organic` - Organic certification status
- `vegetarian` - Vegetarian-friendly status
- `vegan` - Vegan-friendly status
- `operatorType` - Type of food business operator
- `operatorName` - Name of the operator
- `operatorAddress` - Operator's address
- `operatorInfo` - Additional operator information
- `countryOfOrigin` - Country of origin
- `sku` - Stock keeping unit
- `ean` - European Article Number
- `externalLink` - External product link
- `redirectLink` - Redirect URL
- `imageUrl` - Product image path
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `createdBy` - User who created the record

### Ingredients Table

- `id` - Primary key
- `name` - Ingredient name
- `category` - Ingredient category
- `eNumber` - E-number identifier
- `allergens` - Array of allergens
- `details` - Additional details
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `createdBy` - User who created the record

### Users Table

- `id` - Primary key
- `username` - User's username
- `email` - User's email
- `password` - Hashed password
- `isEmailConfirmed` - Email confirmation status
- `emailConfirmationToken` - Email confirmation token
- `emailConfirmationTokenExpiry` - Token expiry timestamp
- `createdAt` - Account creation timestamp

## Import/Export Format

### Products Excel Format

Required columns:
- `Name` - Product name
- `Brand` - Brand name (optional)
- `Net Volume` - Volume information
- `Vintage` - Vintage year
- `Wine Type` - Type of wine/beverage
- `Sugar Content` - Sugar content
- `Appellation` - Appellation
- `Alcohol Content` - Alcohol percentage
- `Packaging Gases` - Packaging gases used
- `Portion Size` - Serving portion size
- `Kcal` - Calories per portion
- `Kj` - Kilojoules per portion
- `Fat` - Fat content
- `Carbohydrates` - Carbohydrate content
- `Organic` - Organic status (true/false)
- `Vegetarian` - Vegetarian status (true/false)
- `Vegan` - Vegan status (true/false)
- `Operator Type` - Type of food business operator
- `Operator Name` - Name of the operator
- `Operator Address` - Operator's address
- `Operator Info` - Additional operator information
- `Country of Origin` - Country of origin
- `SKU` - Stock keeping unit
- `EAN` - European Article Number
- `External Link` - External product link
- `Redirect Link` - Redirect URL

### Ingredients Excel Format

Required columns:
- `Name` - Ingredient name
- `Category` - Category
- `E Number` - E-number
- `Allergens` - Comma-separated allergens
- `Details` - Additional details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
