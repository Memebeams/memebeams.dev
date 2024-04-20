import { Client, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { BountyFeature } from './commands/bounty/bounty.cmd';

export class Bot {
  private readonly clientId = process.env['CLIENT_ID'];
  private readonly guildId = process.env['SERVER_ID'];

  private readonly client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
  });

  private readonly rest = new REST().setToken(process.env['DISCORD_TOKEN']);

  private bounty: BountyFeature;

  async init() {
    this.client.once(Events.ClientReady, (client) => {
      console.info(`Ready! Logged in as ${client.user.tag}.`);
    });

    await this.client.login(process.env['DISCORD_TOKEN']);
    await this.setupCommands();
  }

  private async setupCommands() {
    this.bounty = new BountyFeature();
    await this.bounty.init(this.client);

    await this.rest.put(
      Routes.applicationGuildCommands(this.clientId, this.guildId),
      { body: [...this.bounty.commands] }
    );
  }

  public syncBounty(key: string) {
    if (key !== process.env['SYNC_KEY']) return;
    this.bounty.sync();
  }
}
