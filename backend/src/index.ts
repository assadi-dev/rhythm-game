import 'dotenv/config';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`🎵 Rhythm Game API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
});
