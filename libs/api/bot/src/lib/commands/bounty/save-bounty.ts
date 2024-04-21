import axios from 'axios';
import { writeFile } from 'fs/promises';
import { mkdirp } from 'mkdirp';
import { BountyFeature } from './bounty.cmd';
import path = require('path');

export class SaveBounty {
  private readonly BIN_API_KEY = process.env['BIN_API_KEY'];
  private readonly BIN_ID = process.env['BOUNTY_BIN_ID'];

  constructor(private readonly feature: BountyFeature) {}

  public async sync() {
    console.info('Saving bounty...');

    await this.saveViaFs();
  }

  private async saveViaFs() {
    const file = path.join(this.feature.config.dataPath, '/bounty.json');
    console.info('Saving bounty to:', file);
    try {
      await mkdirp(path.join(this.feature.config.dataPath));
      await writeFile(file, JSON.stringify(this.feature.bounty));
      console.info('Bounty saved!');
    } catch (error) {
      console.error('Failed to save bounty:', error);
      return;
    }
  }

  private async saveViaAxios() {
    try {
      await axios({
        method: 'put',
        url: `https://api.jsonbin.io/v3/b/${this.BIN_ID}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.BIN_API_KEY,
        },
        data: JSON.stringify(this.feature.bounty),
      });
    } catch (error) {
      console.error('Failed to save bounty:', error);
      return;
    }
  }
}
