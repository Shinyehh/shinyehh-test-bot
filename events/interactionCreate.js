const { rolePermission } = require("../slashcommands/prestige")
const { owner } = require('../config/config')

module.exports = {
    name: "interactionCreate",
    run: async (bot, interaction) => {
        if (interaction.isCommand()) handleSlashCommand(bot, interaction)
        else if (interaction.isButton()) handleButton(bot, interaction)
    },
}

const handleButton = (bot, interaction) => {
    const { client } = bot

    // "name-param1-param2-..."
    const [name, ...params] = interaction.customId.split("-")

    const button = client.buttons.get(name)

    if (!button) return
    button.run(client, interaction, params)
}

const handleSlashCommand = (bot, interaction) => {
    const { client } = bot
    if (!interaction.inGuild()) return interaction.reply("This command can only be used in a server")

    //console.log(client.slashcommands)
    const slashcmd = client.slashcommands.get(interaction.commandName)

    //console.log(slashcmd)
    if (!slashcmd) return interaction.reply("Invalid slash command")

    if (slashcmd.perm && !interaction.member.permission.has(slashcmd.perm))
        return interaction.reply("You do not have permission for this command")

    if (slashcmd.rolePermission) {
        const member = interaction.member

        // console.log(member.id)
        if (member.id !== owner) {
            const guild = member.guild
            if (!guild) return interaction.reply("Error: Member using this command is not in a guild!")

            const role = guild.roles.cache.get(rolePermission)
            if (!role) return interaction.reply("Error: The required role to used this command does not exist!")
            const rolePosition = role.position
            const highestUserRolePosition = member.roles.highest.position

            if (highestUserRolePosition < rolePosition) return interaction.reply("You are not allowed to use this slash command")
        }

    }

    if (slashcmd.allowedChannels) {
        let channelId = String(interaction.channelId)
        if (!channelId) return interaction.reply("Error: Cannot find channel!")

        let correctChannel = false
        for (const id of slashcmd.allowedChannels) {
            if (id == channelId) {
                correctChannel = true
                break
            }
        }
        if (!correctChannel) return interaction.reply("Error: Cannot use this command in this channel!")
    }

    slashcmd.run(client, interaction)
}
