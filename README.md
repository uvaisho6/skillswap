# SkillSwap Local

SkillSwap Local is a hyperlocal marketplace where people exchange skills (barter credits) or sell micro-services for cash.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Next, create a `.env` file in the root of the project and add the following environment variables:

```
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
OPENCAGE_API_KEY=
OPENAI_API_KEY=
```

Then, run the database migrations:

```bash
npx prisma migrate dev
```

Finally, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Seeding the Database

To seed the database with initial data, run the following command:

```bash
npm run seed
# skillswap
# skillswap
