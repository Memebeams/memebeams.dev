import {
  Client,
  CommandInteraction,
  EmbedBuilder,
  Events,
  SlashCommandBuilder,
  TimestampStyles,
  User,
  time,
  userMention,
} from 'discord.js';

export class BountyCommand {
  public readonly SlashCommand = new SlashCommandBuilder()
    .setName('bounty')
    .setDescription('Set a new bounty.')
    .addStringOption((option) =>
      option
        .setName('target')
        .setDescription('The target of your bounty.')
        .setRequired(true)
    )
    .toJSON();

  public init(client: Client) {
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isCommand()) return;

      if (interaction.commandName === 'bounty') {
        await this.execute(interaction);
      }
    });
  }

  private async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    const target = interaction.options.getString('target');
    const user = interaction.user;
    await interaction.reply({
      embeds: [this.generateBountyEmbed(target, user)],
    });
  }

  private generateBountyEmbed(target: string, user: User) {
    const deadline = Math.floor(
      new Date().getTime() / 1000 + 60 * 60 * 24 * 14
    );

    return new EmbedBuilder()
      .setTitle('**WANTED**')
      .setDescription(`**${target}**`)
      .setColor([200, 0, 0])
      .setURL('https://memebeams.github.io/memebeams.dev/clan/bounty')
      .addFields(
        { name: 'Posted by:', value: userMention(user.id) },
        { name: 'Due:', value: time(deadline, TimestampStyles.RelativeTime) }
      )
      .setTimestamp();
  }
}
