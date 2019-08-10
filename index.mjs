import * as alt from 'alt';

let cmdHandlers = [];
let mutedPlayers = new Map();

const admins = [];

function invokeCmd(player, cmd, args) {
  const command = cmdHandlers.find(x => x.name == cmd);
  if (command == null)
    return send(player, `{FF0000} Unknown command /${cmd}`);

  if (command.admin && !player.getMeta("isChatAdmin"))
    return send(player, `{FF0000} Your not allowed to use /${cmd}`);

  command.cb(player, args);
}

alt.onClient('chatmessage', (player, msg) => {
  if (msg[0] === '/') {
    msg = msg.trim().slice(1);

    if (msg.length > 0) {
      alt.log('[chat:cmd] ' + player.name + ': /' + msg);

      let args = msg.split(' ');
      let cmd = args.shift();

      invokeCmd(player, cmd, args);
    }
  } else {
    if (mutedPlayers.has(player) && mutedPlayers[player]) {
      send(player, '{FF0000} You are currently muted.');
      return;
    }

    msg = msg.trim();

    if (msg.length > 0) {
      alt.log('[chat:msg] ' + player.name + ': ' + msg);

      alt.emitClient(null, 'chatmessage', player.name, msg.replace(/</g, '&lt;').replace(/'/g, '&#39').replace(/"/g, '&#34'));
    }
  }
});

export function send(player, msg) {
  alt.emitClient(player, 'chatmessage', null, msg);
}

export function broadcast(msg) {
  send(null, msg);
}

export function registerCmd(cmd, callback, isAdmin = false, datas = {}) {
  if (cmdHandlers.find(x => x.name == cmd) != null) {
    alt.logError(`Failed to register command /${cmd}, already registered`);
  } else {
    let com = {name: cmd, cb: callback, admin: isAdmin, help: (datas.help || ''), params: (datas.params || [])};
    alt.emitClient(null, 'addCommand', com);
    cmdHandlers.push(com);
  }
}

alt.on('playerConnect', (player) => {
  player.setMeta("isChatAdmin", (admins.indexOf(player.socialId) != -1))

  alt.emitClient(player, 'setCommands', cmdHandlers);
});

// Used in an onConnect function to add functions to the player entity for a seperate resource.
export function setupPlayer(player) {
  player.sendMessage = (msg) => {
    send(player, msg);
  }

  player.mute = (state) => {
    mutedPlayers.set(player, state);
  }
}

// Arbitrary events to call.
alt.on('sendChatMessage', (player, msg) => {
  send(player, msg);
});

alt.on('broadcastMessage', (msg) => {
  send(null, msg);
});

registerCmd('clear', () => {
  alt.emitClient(null, 'clearChat');
}, true, {help: 'Clear the chat of all connected users'});

export default { send, broadcast, registerCmd, setupPlayer };
