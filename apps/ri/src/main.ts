/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { battleship } from '@memebeams-dev/battleship';
import { Bot } from '@memebeams-dev/bot';
import cors from 'cors';
import express from 'express';
import * as path from 'path';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const corsOptions = {
  origin: [/localhost:\d+/, /^https:\/\/memebeams\.github\.io\/?.*$/],
};

app.use(cors(corsOptions));

const port = process.env.PORT || 3333;
const server = app.listen(port, async () => {
  const bot = new Bot();
  await bot.init();

  app.post('/sync-bounty', async (req, res) => {
    const key = req.body?.['key'];
    bot.syncBounty(key);
    res.status(200).send();
  });

  battleship(app);
});

server.on('error', console.error);
