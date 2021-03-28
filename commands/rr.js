const { addToCache } = require('../features/rr')
const messageSchema = require('../models/message')
const activeSchema = require('../models/active-message')
const { MessageEmbed } = require("discord.js");

module.exports = {
  name: `reaction-role`,
  aliases: ["rr"],
  minArgs: 3,
  requiredPermission: ['ADMINISTRATOR'],
  async execute(message, args) {
    const { guild } = message
    if (!args.length) {
      const erembed = new MessageEmbed()
      .setTitle(`❌ Invalid Usage!`)
      .setDescription(`\u200b\n${message.client.prefix}reaction-role <Emoji> <Role name, tag, or ID> <Role display name>`)
      .setColor("#f72f43")
      return message.channel.send(erembed)
    }

    if (!guild.me.hasPermission('MANAGE_ROLES')) {
      message.channel.send('**❌ The bot requires access to manage roles to work correctly**')
      return
    }

    let emoji = args.shift() // 🎮
    let role = args.shift() // role
    const displayName = args.join(' ') // 'game role'

    if (role.startsWith('<@&')) {
      role = role.substring(3, role.length - 1)
    }

    const newRole =
      guild.roles.cache.find((r) => {
        return r.name === role || r.id === role
      }) || null

    if (!newRole) {
      message.reply(`Could not find a role for "${role}"`)
      return
    }

    role = newRole

    if (emoji.includes(':')) {
      const emojiName = emoji.split(':')[1]
      emoji = guild.emojis.cache.find((e) => {
        return e.name === emojiName
      })
    }
    const result = await activeSchema.findOne({ guildId: guild.id })
    const channell = await guild.channels.cache.get(result.channelId)
    const fetchedMessage = await channell.messages.fetch(result.messageId)
    if (!fetchedMessage) {
      message.channel.send('**❌ An error occurred, please try again**')
      return
    }

    const newLine = `**${emoji} = ${displayName}**`
    
    const receivedEmbed = fetchedMessage.embeds[0];
    let content = receivedEmbed.description;
    if (content.includes(emoji)) {
      const split = content.split('\n')

      for (let a = 0; a < split.length; ++a) {
        if (split[a].includes(emoji)) {
          split[a] = newLine
        }
      }

      content = split.join('\n')
    } else {
      content += `\n\n${newLine}`
      fetchedMessage.react(emoji)
    }
    const embed = new MessageEmbed()
    .setDescription(`${content}`)
    .setColor(receivedEmbed.color)
    fetchedMessage.edit(embed)
    //console.log(`fetch - ${role.id} , normal = ${role}`)
    
    if (fetchedMessage.channel.id !== message.channel.id) {
      const embed = new MessageEmbed()
      .setTitle(`✅ Success`)
      .setDescription(`${role} added with the emoji ${emoji}`)
      .setColor("#2ff78c")
      message.channel.send(embed)
    }

    const obj = {
      guildId: guild.id,
      channelId: fetchedMessage.channel.id,
      messageId: fetchedMessage.id,
    }

    await messageSchema.findOneAndUpdate(
      obj,
      {
        ...obj,
        $addToSet: {
          roles: {
            emoji,
            roleId: role.id,
          },
        },
      },
      {
        upsert: true,
      }
    )
    addToCache(guild.id, fetchedMessage, emoji, role.id)
  },
}