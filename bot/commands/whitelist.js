const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
var fs = require('fs');
var https = require('https');
const Rcon = require('modern-rcon');
const rcon = new Rcon('mc', 'tina');

async function getJsonFromUrl(url) {
    return new Promise((resolve) => {
        https.get(url, response => {
            let body = "";
            let json;

            response.on("data", (chunk) => {
                body += chunk;
            });

            response.on("end", () => {
                try {
                    json = JSON.parse(body);
                }
                catch (err) {
                    console.error(error.message);
                }
                resolve(json);
            });
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription("Whitelist yourself for the Minecraft server")
        .addStringOption(option =>
            option.setName('name')
            .setDescription("Minecraft name of who you're whitelisting.")
            .setRequired(true)),
    async execute(interaction) {
        var name = interaction.options.getString('name');
        let image_bytes_str = (await getJsonFromUrl(`https://minecraft-api.com/api/skins/${name}/full/10.5/10/json`))["skin"];
        let uuid = (await getJsonFromUrl(`https://minecraft-api.com/api/uuid/${name}/json`))['uuid']
        let image_bytes = Buffer.from(image_bytes_str, "base64");
        let attachment = new AttachmentBuilder(image_bytes).setName(`${name}.png`);
        console.log(attachment.name);

        const embed = new EmbedBuilder()
            .setTitle("Is this the correct Minecraft profile to whitelist?")
            .setImage(`attachment://${attachment.name}`)
            .setDescription(`${name} with ${uuid}`)

        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Primary);

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder()
            .addComponents(confirm, cancel);

        const response = await interaction.reply(
            {
                embeds: [embed],
                files: [attachment],
                components: [row]
            }
        );

        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (confirmation.customId === 'confirm') {
                // If server down
                // let rawdata = fs.readFileSync(whitelistPath);
                // let whitelistData = JSON.parse(rawdata);
                // whitelistData.push({
                //     "uuid": uuid,
                //     "name": name
                // })
                // fs.writeFileSync(whitelistPath, JSON.stringify(whitelistData));

                // If server up
                rcon.connect().then(() => {
                        return rcon.send(`whitelist add ${name}`);
                    }
                ).then(res => {
                    console.log(res);
                }).then(() => {
                    return rcon.disconnect();
                });
                await confirmation.update({ content: `${name} with ${uuid} has been added to the whitelist!`, embeds: [], components: [], files: [] });
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: 'Action cancelled',  embeds: [], components: [], files: [] });
            }
        } catch (e) {
            console.log(e);
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', embeds: [], components: [], files: [] });
        }
    },
};