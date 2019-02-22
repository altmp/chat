import alt from 'alt';

let buffer = [];

let loaded = false;
let opened = false;
let hidden = false;

let view = new alt.WebView("http://resources/chat/html/index.html");

function addMessage(name, text) {
  if (name) {
    view.execJS(`addMessage('${name}', '${text}')`);
  } else {
    view.execJS(`addString('${text}')`);
  }
}

view.on('chatloaded', () => {
  for (const msg of buffer) {
    addMessage(msg.name, msg.text);
  }

  alt.log('loaded');
  loaded = true;
})

view.on('chatmessage', (text) => {
  alt.emitServer('chatmessage', text);

  opened = false;
  alt.toggleGameControls(true);
})

export function pushMessage(name, text) {
  if (!loaded) {
    buffer.push({ name, text });
  } else {
    addMessage(name, text);
  }
}

export function pushLine(text) {
  pushMessage(null, text);
}

alt.onServer('chatmessage', pushMessage);

alt.on('keyup', (key) => {
  if (!loaded)
    return;

  if (!opened && key === 0x54 && alt.gameControlsEnabled()) {
    opened = true;
    view.execJS('openChat()');
    alt.toggleGameControls(false);
  } else if (!opened && key === 0xBF && alt.gameControlsEnabled()) {
    opened = true;
    view.execJS('openChat(true)');
    alt.toggleGameControls(false);
  }
  else if (opened && key == 0x1B) {
    opened = false;
    view.execJS('closeChat()');
    alt.toggleGameControls(true);
  }

  if (key == 0x76) {
    hidden = !hidden;
    alt.log(hidden);
    alt.DisplayHud(!hidden);
    alt.DisplayRadar(!hidden);
    view.execJS(`hideChat(${hidden})`);
  }
})

export default { pushMessage, pushLine };
