import axios from 'axios';
import { Client } from 'discord.js';
import { Bounty } from './bounty';
import { BountyFeature } from './bounty.cmd';

export class LoadBounty {
  private readonly BIN_API_KEY = process.env['BIN_API_KEY'];
  private readonly BIN_ID = process.env['BOUNTY_BIN_ID'];

  constructor(
    private readonly client: Client,
    private readonly feature: BountyFeature
  ) {}

  public async load() {
    const response = await axios.get(
      `https://api.jsonbin.io/v3/b/${this.BIN_ID}`,
      {
        headers: {
          'X-Master-Key': this.BIN_API_KEY,
          'X-Bin-Meta': false,
        },
      }
    );

    if (!response.data?.record) return;
    const bounty = response.data.record as Bounty;
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
