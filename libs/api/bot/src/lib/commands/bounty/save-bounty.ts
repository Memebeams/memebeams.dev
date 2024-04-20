import axios from 'axios';
import { BountyFeature } from './bounty.cmd';

export class SaveBounty {
  private readonly BIN_API_KEY = process.env['BIN_API_KEY'];

  constructor(private readonly feature: BountyFeature) {}

  public async sync() {
    if (!this.feature.bounty) return;

    await axios.put('https://api.jsonbin.io/v3/b/662407ffe41b4d34e4e7afa8', {
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': this.BIN_API_KEY,
      },
      data: this.feature.bounty,
    });
  }
}
