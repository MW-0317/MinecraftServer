const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
var fs = require('fs');
var https = require('https');
const Rcon = require('modern-rcon');
const rcon = new Rcon('mc', 'tina');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rcon')
        .setDescription("rcon for stuff")
        .addStringOption(option =>
            option.setName('command')
            .setDescription("Rcon command to run")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        var command = interaction.options.getString('command');
        rcon.connect().then(() => {
            return rcon.send(`${command}`);
        });
    },
};