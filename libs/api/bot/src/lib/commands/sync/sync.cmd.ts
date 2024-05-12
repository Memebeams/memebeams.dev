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
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { mkdirp } from 'mkdirp';
import path = require('path');

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

  private readonly RegisterCommand = new SlashCommandBuilder()
    .setName('register')
    .setDescription(
      'Register your Discord username with an RSN for rank syncing.'
    )
    .addStringOption((option) =>
      option
        .setName('rsn')
        .setDescription('The RSN to register.')
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(
          'If you are an admin, you can set the RSN of another user.'
        )
        .setRequired(false)
    );

  public readonly commands = [this.SyncCommand, this.RegisterCommand];

  private readonly wom = new WOMClient();

  // TODO: roles config
  private rankToRolesMap = {
    striker: 'Steel',
    legacy: 'Steel',
    expert: 'Adamant',
    pyromancer: 'Adamant',
    knight: 'Rune',
    prodigy: 'Rune',
    paladin: 'Dragon',
    firestarter: 'Dragon',
    wrath: 'Wrath',
    beast: 'Beast',
  };

  private readonly roles: { [key: string]: Role } = {};

  // TODO: Add config support
  private config = {
    adminRole: 'Council',
    groupId: 4965,
    dataPath: '/var/data',
  };

  private client: Client;

  private guild: Guild;
  private registeredMembers: { [rsn: string]: GuildMember } = {};
  private members: { [displayName: string]: GuildMember } = {};

  public async init(client: Client) {
    this.client = client;

    this.guild = await this.client.guilds.fetch(this.SERVER_ID);

    await this.updateMembers();
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

    this.initSyncCommand();
    await this.initRegisterCommand();
  }

  private initSyncCommand() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === 'sync'
      ) {
        console.log(
          Object.entries(this.registeredMembers).map(
            ([rsn, member]) => `RSN: ${rsn}, Member: ${member.displayName}`
          )
        );
        console.log(
          Object.entries(this.roles).map(
            ([rank, role]) => `Rank: ${rank}, Role: ${role.name}`
          )
        );
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
  }

  private async initRegisterCommand() {
    await this.loadRegisteredMembers();
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === 'register'
      ) {
        await interaction.deferReply({ ephemeral: true });

        const rsn = interaction.options.getString('rsn').toLowerCase();
        let member = interaction.member as GuildMember;
        const isAdmin = member.roles.cache.some(
          (role) => role.name === this.config.adminRole
        );

        const targetUser = interaction.options.getUser('user');

        if (!isAdmin && !!targetUser) {
          interaction.editReply({
            content: `You must have the '${this.config.adminRole}' role to set another user's RSN.`,
          });
          return;
        }

        if (targetUser) member = this.guild.members.cache.get(targetUser.id);
        if (
          this.registeredMembers[rsn] &&
          this.registeredMembers[rsn].id === member.id
        ) {
          await interaction.editReply({
            content: `RSN '${rsn}' is already registered for ${member.displayName}.`,
          });
          return;
        }

        const oldEntry = Object.entries(this.registeredMembers).find(
          ([key, value]) => value.id === member.id
        );

        if (oldEntry) {
          delete this.registeredMembers[oldEntry[0]];
        }

        this.registeredMembers[rsn] = member;
        await this.saveRegisteredMembers();
        await interaction.editReply({
          content: `Successfully registered RSN '${rsn}' for ${member.displayName}.`,
        });
      }
    });
  }

  private async saveRegisteredMembers() {
    const file = path.join(this.config.dataPath, '/members.json');
    console.info('Saving members to:', file);
    try {
      await mkdirp(path.join(this.config.dataPath));
      const memberIds = Object.entries(this.registeredMembers).reduce(
        (acc, [rsn, member]) => {
          acc[rsn] = member.id;
          return acc;
        },
        {}
      );

      await writeFile(file, JSON.stringify(memberIds));
      console.info('Members saved!');
    } catch (error) {
      console.error('Failed to save members:', error);
      return;
    }
  }

  private async loadRegisteredMembers() {
    const file = path.join(this.config.dataPath, '/members.json');
    console.info('Loading members from:', file);
    if (!existsSync(file)) return;
    try {
      const memberIdsJson = await readFile(file);
      const memberIds: { [rsn: string]: string } = JSON.parse(
        memberIdsJson.toString()
      );

      for (let [rsn, id] of Object.entries(memberIds)) {
        console.log('Loading member:', rsn, id);
        const member = await this.guild.members.fetch(id);
        console.log('Member found:', rsn, member.displayName);
        this.registeredMembers[rsn] = member;
      }

      console.info('Members loaded!');
    } catch (error) {
      console.error('Failed to load members:', error);
      return;
    }
  }

  private async updateMembers() {
    const members = await this.guild.members.fetch();
    this.members = members.reduce((acc, member) => {
      acc[member.displayName.toLowerCase()] = member;
      return acc;
    }, {});
  }

  private async sync(
    interaction: ChatInputCommandInteraction,
    updateRoles: boolean
  ) {
    await interaction.deferReply({ ephemeral: true });

    await this.updateMembers();

    const group = await this.wom.groups.getGroupDetails(this.config.groupId);

    const roleChanges: RoleChange[] = [];
    group.memberships.forEach(async (membership) => {
      const newRole = this.roles[membership.role];
      if (!newRole) return;

      const rsn = membership.player.username.toLowerCase();
      const member = this.registeredMembers[rsn] ?? this.members[rsn];
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

    if (!updateRoles) {
      const embed = new EmbedBuilder()
        .setTitle('Rank updates that will be applied:')
        .setDescription(body);

      await interaction.editReply({
        embeds: [embed],
      });
      return;
    } else {
      roleChanges.forEach(async (change) => {
        for (const role of change.oldRoles) {
          await change.member.roles.remove(role);
        }
        await change.member.roles.add(change.newRole);
      });

      const embed = new EmbedBuilder()
        .setTitle('Rank updates applied:')
        .setDescription(body);

      await interaction.editReply({
        embeds: [embed],
      });
    }
  }
}
