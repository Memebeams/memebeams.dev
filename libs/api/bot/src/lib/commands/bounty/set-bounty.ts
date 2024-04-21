import {
  ChatInputCommandInteraction,
  Client,
  Events,
  GuildMember,
  channelMention,
  roleMention,
} from 'discord.js';
import { BountyFeature } from './bounty.cmd';

export class SetBounty {
  constructor(
    private readonly client: Client,
    private readonly feature: BountyFeature
  ) {}

  public init() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === 'set-bounty'
      ) {
        await this.setBounty(interaction);
        await this.feature.saveBounty.sync();
      }
    });
  }

  private async setBounty(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    await interaction.deferReply({ ephemeral: true });

    if (!this.feature.verifyChannel(interaction)) {
      interaction.editReply({
        content: `You can only post bounties in ${channelMention(
          this.feature.channel?.id ?? ''
        )}`,
      });
      return;
    }

    const author =
      interaction.options.getUser(this.feature.USER_KEY) ?? interaction.user;
    // If the user running the command is not an admin
    if (!this.feature.isAdmin(interaction.member as GuildMember)) {
      // And the user is not the author of the bounty
      if (author.id !== interaction.user.id) {
        interaction.editReply({
          content: `Only ${roleMention(
            this.feature.role.id
          )} can post bounties for other users.`,
        });
        return;
      }

      if (!this.feature.isWinner(author)) {
        interaction.editReply({
          content: `To post a bounty, you must have been the one to complete the last bounty.`,
        });
        return;
      }
    }

    const bounty = this.feature.generateBounty(interaction, author);
    const embed = await this.feature.generateEmbedFromBounty(bounty, author);
    await interaction.deleteReply();
    await this.feature.channel?.send({
      embeds: [embed],
    });

    this.feature.author = author;
    this.feature.bounty = bounty;
  }
}
