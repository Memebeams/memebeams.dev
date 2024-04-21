import { ChatInputCommandInteraction, Client, Events } from 'discord.js';
import { BountyFeature } from './bounty.cmd';

export class ShowBounty {
  constructor(
    private readonly client: Client,
    private readonly feature: BountyFeature
  ) {}

  public init() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === 'bounty'
      ) {
        await this.showBounty(interaction);
      }
    });
  }

  private async showBounty(interaction: ChatInputCommandInteraction) {
    if (!this.feature.bounty) {
      await interaction.reply({
        content: 'There is no bounty set currently.',
        ephemeral: true,
      });
    } else {
      const embed = await this.feature.generateEmbedFromBounty(
        this.feature.bounty,
        this.feature.author
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}
