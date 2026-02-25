import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/server/db/schema/tables.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: { url: process.env.DATABASE_URL || 'file:./data/molos.db' },
	verbose: true,
	strict: true
});
