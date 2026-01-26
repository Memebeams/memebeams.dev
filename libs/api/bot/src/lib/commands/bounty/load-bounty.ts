import { Client } from 'discord.js';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { Bounty } from './bounty';
import { BountyFeature } from './bounty.cmd';
import path = require('path');

export class LoadBounty {
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
}
