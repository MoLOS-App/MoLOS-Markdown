import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/server/database/schema/tables.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: { url: 'file:../../molos.db' },
	verbose: true,
	strict: true
});
