import axios from 'axios';
import { Client } from 'discord.js';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { Bounty } from './bounty';
import { BountyFeature } from './bounty.cmd';
import path = require('path');

export class LoadBounty {
  private readonly BIN_API_KEY = process.env['BIN_API_KEY'];
  private readonly BIN_ID = process.env['BOUNTY_BIN_ID'];

  constructor(
    private readonly client: Client,
    private readonly feature: BountyFeature
  ) {}

  public async load() {
    const file = path.join(this.feature.config.dataPath, '/bounty.json');
    console.info('Looking for bounty file at:', file);
    if (!existsSync(file)) return;
    const bountyJson = await readFile(file);
    const bounty: Bounty = JSON.parse(bountyJson.toString());

    this.feature.bounty = bounty;
    if (bounty.authorId)
      this.feature.author = await this.loadUser(bounty.authorId);
    if (bounty.winnerId)
      this.feature.winner = await this.loadUser(bounty.winnerId);
  }

  private async loadUser(id: string) {
    return this.client.users.fetch(id);
  }

  private async loadViaAxios() {
    const response = await axios.get(
      `https://api.jsonbin.io/v3/b/${this.BIN_ID}`,
      {
        headers: {
          'X-Master-Key': this.BIN_API_KEY,
          'X-Bin-Meta': false,
        },
      }
    );

    return response.data.record;
  }
}
