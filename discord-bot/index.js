const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;
require('dotenv').config({ path: './store.env' });
app.use(cors()); 
let currentStatus = 'offline';

const YOUR_USER_ID = '743687409786552391';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.User, Partials.GuildMember]
});

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
  if (newPresence.userId === YOUR_USER_ID) {
    currentStatus = newPresence?.status || 'offline';
    console.log(`🔄 Status changed to: ${currentStatus}`);
  }
});

// Serve your status over HTTP so the website can fetch it
app.get('/status', (req, res) => {
  res.json({ status: currentStatus });
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});

client.login(process.env.BOT_TOKEN);
