const messageSchema = require('../models/message')
const client = require("../index");
const activeSchema = require('../models/active-message')

const cache = {} // { guildId: [message, { Emoji: RoleID }] }

const fetchCache = (guildId) => cache[guildId] || []

const addToCache = async (guildId, message, emoji, roleId) => {
  const array = cache[guildId] || [message, {}]

  if (emoji && roleId) {
    array[1][emoji] = roleId
  }

  await message.channel.messages.fetch(message.id, true, true)

  cache[guildId] = array
}

const handleReaction = async (reaction, user, adding) => {
  const results = await messageSchema.find()

  for (const result of results) {
    const { guildId, channelId, messageId, roles } = result

    const guild = await client.guilds.cache.get(guildId)

    if (!guild) {
      console.log(`Removing guild ID "${guildId}" from the database`)
      await messageSchema.deleteOne({ guildId })
      await activeSchema.deleteOne({ guildId })
      return
    }

    const channel = await guild.channels.cache.get(channelId)

    if (!channel) {
      console.log(`Removing channel ID "${channelId}" from the database`)
      await messageSchema.deleteOne({ channelId })
      return
    }

    try {
      const cacheMessage = true
      const skipCache = true
      const resultt = await activeSchema.findOne({ guildId: guild.id })
      //if not cache get from db
      const fetchedMessage = await channel.messages.fetch(
        messageId,
        cacheMessage,
        skipCache
      )

      if (fetchedMessage) {
        const newRoles = {}

        for (const role of roles) {
          const { emoji, roleId } = role
          newRoles[emoji] = roleId
        }

        cache[guildId] = [fetchedMessage, newRoles]
      }
    } catch (e) {
      console.log(`Removing message ID "${messageId}" from the database`)
      await messageSchema.deleteOne({ messageId })
    }
  }
  
  const { message } = reaction
  const { guild } = message

  const [fetchedMessage, roles] = fetchCache(guild.id)
  if (!fetchedMessage) {
    return
  }

  if (
    fetchedMessage.id === message.id &&
    guild.me.hasPermission('MANAGE_ROLES')
  ) {
    const toCompare = reaction.emoji.id || reaction.emoji.name

    for (const key of Object.keys(roles)) {
      if (key === toCompare) {
        const role = guild.roles.cache.get(roles[key])
        if (role) {
          const member = guild.members.cache.get(user.id)

          if (adding) {
            //console.log(`add  role`)
            member.roles.add(role)
          } else {
            //console.log(`remove role`)
            member.roles.remove(role)
          }
        }
        return
      }
    }
  }
}

client.on('messageReactionAdd', async (reaction, user) => {
  //console.log(`reaction - add `)
  handleReaction(reaction, user, true)
})

client.on('messageReactionRemove', async (reaction, user) => {
  //console.log(`reaction - remove `)
  handleReaction(reaction, user, false)
})

module.exports.fetchCache = fetchCache
module.exports.addToCache = addToCache