import { writeFile } from 'fs/promises';
import { mkdirp } from 'mkdirp';
import { BountyFeature } from './bounty.cmd';
import path = require('path');

export class SaveBounty {
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
}
