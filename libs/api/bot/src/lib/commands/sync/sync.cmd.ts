import { WOMClient } from '@wise-old-man/utils';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Events,
  Guild,
  GuildMember,
  Role,
  SlashCommandBuilder,
} from 'discord.js';

interface RoleChange {
  member: GuildMember;
  oldRoles: Role[];
  newRole: Role;
}

export class SyncFeature {
  public readonly SERVER_ID = process.env['SERVER_ID'];

  private readonly SyncCommand = new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Sync ranks with Guild Ranks from Wise Old Man.')
    .addBooleanOption((option) =>
      option
        .setName('update-roles')
        .setDescription('Ranks are only updated if you set this to true.')
        .setRequired(false)
    );

  public readonly commands = [this.SyncCommand];

  private readonly wom = new WOMClient();

  // TODO: roles config
  private rankToRolesMap = {
    striker: 'Steel Rank',
    legacy: 'Steel Rank',
    expert: 'Adamant Rank',
    pyromancer: 'Adamant Rank',
    knight: 'Rune Rank',
    prodigy: 'Rune Rank',
    paladin: 'Dragon Rank',
    firestarter: 'Dragon Rank',
    wrath: 'Wrath',
    imp: 'Imp',
    beast: 'Beast Rank',
  };

  private readonly roles: { [key: string]: Role } = {};
  private readonly rsnToDiscordId: { [key: string]: string } = {};

  private config = {
    adminRole: 'Council',
    groupId: 4965,
  };

  private client: Client;

  private guild: Guild;
  private registeredMembers: { [rsn: string]: GuildMember } = {};
  private members: { [displayName: string]: GuildMember } = {};

  public async init(client: Client) {
    this.client = client;

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === 'sync'
      ) {
        const member = interaction.member as GuildMember;
        const isAdmin = member.roles.cache.some(
          (role) => role.name === this.config.adminRole
        );
        if (!isAdmin) {
          interaction.reply({
            content: `You must have the '${this.config.adminRole}' role to use this command.`,
            ephemeral: true,
          });
          return;
        }

        const updateRoles = interaction.options.getBoolean('update-roles');

        await this.sync(interaction, updateRoles);
      }
    });

    this.guild = await this.client.guilds.fetch(this.SERVER_ID);
    const members = await this.guild.members.fetch();
    members.forEach((member) => {
      this.members[member.displayName.toLowerCase()] = member;
    });

    Object.entries(this.rankToRolesMap).forEach(([rank, roleName]) => {
      const role = this.guild.roles.cache.find(
        (role) => role.name === roleName
      );
      if (!role) {
        console.error(`Role '${roleName}' not found for rank '${rank}'.`);
        return;
      }

      this.roles[rank] = role;
    });
  }

  private async sync(
    interaction: ChatInputCommandInteraction,
    updateRoles: boolean
  ) {
    if (updateRoles) {
      await interaction.editReply(
        'Applying the roles is not implemented yet, but you can preview the changes by leaving update-roles as false.'
      );
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const group = await this.wom.groups.getGroupDetails(this.config.groupId);

    const roleChanges: RoleChange[] = [];
    group.memberships.forEach(async (membership) => {
      const newRole = this.roles[membership.role];
      if (!newRole) return;

      const rsn = membership.player.username;
      const knownMember = this.registeredMembers[rsn];
      const member = knownMember ?? this.members[rsn];
      if (!member) return;

      const memberHasRole = member.roles.cache.find(
        (role) => role.name === newRole.name
      );
      if (memberHasRole) return;

      const otherRoles = member.roles.cache.filter(
        (role) =>
          role.name !== newRole.name &&
          Object.values(this.rankToRolesMap).includes(role.name)
      );

      roleChanges.push({
        member,
        oldRoles: Array.from(otherRoles.values()),
        newRole,
      });
    });

    let body = '';
    if (roleChanges.length) {
      const backticks = '```';
      let lines = '';
      roleChanges.forEach((change) => {
        let line = `${change.member.displayName}: ${change.newRole.name}`;
        if (change.oldRoles.length) {
          line = `${line} (was ${change.oldRoles
            .map((role) => role.name)
            .join(', ')})`;
        }
        lines = `${lines}\n${line}`;
      });

      body = `${backticks}${lines}${backticks}`;
    } else {
      body = 'No rank updates to apply.';
    }

    const embed = new EmbedBuilder()
      .setTitle('Rank updates that will be applied:')
      .setDescription(body);

    await interaction.editReply({
      embeds: [embed],
    });
  }
}
