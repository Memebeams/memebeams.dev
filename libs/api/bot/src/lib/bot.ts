import { Client, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { BountyFeature } from './commands/bounty.cmd';

export class Bot {
  private readonly clientId = '1230954550928605194';
  private readonly guildId = '960638968326664222';

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

  async init() {
    this.client.once(Events.ClientReady, (client) => {
      console.info(`Ready! Logged in as ${client.user.tag}.`);
    });

    await this.client.login(process.env['DISCORD_TOKEN']);
    await this.setupCommands();
  }

  private async setupCommands() {
    const bounty = new BountyFeature();
    await bounty.init(this.client);

    await this.rest.put(
      Routes.applicationGuildCommands(this.clientId, this.guildId),
      { body: [...bounty.commands] }
    );
  }
}
