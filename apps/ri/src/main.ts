/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Bot } from '@memebeams-dev/bot';
import express from 'express';
import * as path from 'path';

const app = express();

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to ri!' });
});

const port = process.env.PORT || 3333;
const server = app.listen(port, async () => {
  console.info(`Express server listening at: http://localhost:${port}/api`);
  const bot = new Bot();
  await bot.init();
});

server.on('error', console.error);
