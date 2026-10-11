import app from './app';
import { env } from './config/env';
import { initializeDatabase } from './database/initDb';

async function startServer() {
  await initializeDatabase();

  app.listen(env.PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 MedTrack Backend API Server running on port ${env.PORT}`);
    console.log(`📡 Base URL: http://localhost:${env.PORT}`);
    console.log(`Database Driver: ${env.DB_DRIVER.toUpperCase()}`);
    console.log(`================================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Boot Exception:', err);
});
