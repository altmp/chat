// Set this if you want to show it out of the game
const debugMode = false;

var chatOpened = false;
var chatHighlighted = false;
var timeout;
var buffer = [];
var currentBufferIndex = -1;
var messagesBlock = null;
var msgInputBlock = null;
var msgInputLine = null;
var currHideTO = null;
var commands = [];
var autoHideChat = false;

if (debugMode) {
	const alt_mock = {
		on: (...args) => {
			console.log(...args);
		},
		emit: (...args) => {
			console.log(...args);
		}
	}

	var alt = alt || alt_mock;

	document.onkeypress = function(key) {
		if (key.key == 't') {
			openChat(false);
			return;
		}
	}
}

function colorify(text)
{
  let matches = [];
  let m = null;
  let curPos = 0;
  do {
    m = /\{[A-Fa-f0-9]{3}\}|\{[A-Fa-f0-9]{6}\}/g.exec(text.substr(curPos));
    if(!m)
      break;
    matches.push({
      found: m[0],
      index: m['index'] + curPos
    });
    curPos = curPos + m['index'] + m[0].length;
  } while(m != null);
  if (matches.length > 0) {
    text += '</font>';
    for(let i = matches.length - 1; i >= 0; --i) {
      let color = matches[i].found.substring(1, matches[i].found.length - 1);
      let insertHtml = (i != 0 ? '</font>' : '') + '<font color="#' + color + '">';
      text = text.slice(0, matches[i].index) + insertHtml + text.slice(matches[i].index + matches[i].found.length, text.length);
    }
  }
  return text;
}

function fadeIn(el, time) {
	el.style.opacity = 0;
	el.style.display = 'block';

  var last = +new Date();
  var tick = function() {
    el.style.opacity = (+new Date() - last) / time;

    if (el.style.opacity < 1)
      (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
  };

  tick();
}

function fadeOut(el, time) {
  el.style.opacity = 1;

  var last = +new Date();
  var tick = function() {
	el.style.opacity = 1 - (new Date() - last) / time;
	
    if (+el.style.opacity > 0)
      (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
  };
  tick();
}

function scrollTo(el, to, time) {
	if (time <= 0) {
		el.scrollTop = to;
		return;
	}
	var neg = false;
	if(to < el.scrollTop)
		neg = true;

	var diff = to - el.scrollTop;
	var prevVal = el.scrollTop;

	var last = +new Date();
  var tick = function() {
		el.scrollTop = (neg ? -el.scrollTop : el.scrollTop) + diff * ((new Date() - last) / time);
		if(el.scrollTop == prevVal)
			return;
		prevVal = el.scrollTop;
    last = +new Date();

    if ((el.scrollTop < to && !neg) || (el.scrollTop > to && neg)) {
      (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
    }
  };

  tick();
}

function checkOverflow() {
	if(document.querySelector('.messages').clientHeight > document.querySelector('.msglist').clientHeight) {
		if(!document.querySelector('.msglist').classList.contains('overflowed'))
			document.querySelector('.msglist').classList.add('overflowed');
	}
	else if(document.querySelector('.msglist').classList.contains('overflowed'))
		document.querySelector('.msglist').classList.remove('overflowed');
}

window.addEventListener('load', function(){
	messagesBlock = document.querySelector('.messages');
	msgInputBlock = document.querySelector('.msginput');
	msgInputLine = document.querySelector('.msginput input');
	msgSuggestionsBlock = document.querySelector('.msginput .inputSuggestions');

	alt.emit('chatloaded');
});

function addString(text) {
	if(messagesBlock.children.length > 100)
		messagesBlock.removeChild(messagesBlock.children[0]);
	var p = document.createElement('p');
	p.innerHTML = colorify(text);
	messagesBlock.appendChild(p);
	checkOverflow();
	highlightChat();
}
alt.on('addString', addString);

function addMessage(name, text) {
	if(messagesBlock.children.length > 100)
		messagesBlock.removeChild(messagesBlock.children[0]);
	var p = document.createElement('p');
	p.innerHTML = '<b>' + name + ': </b>' + colorify(text);
	messagesBlock.appendChild(p);
	checkOverflow();
	highlightChat();
}
alt.on('addMessage', addMessage);

alt.on('configChat', (config) => {
	autoHideChat = config.autoHide;
	if (autoHideChat)
		fadeOut(document.querySelector('.chatbox', 500));
	if (config.welcomeMessage != '')
		addString(config.welcomeMessage);
});

function saveBuffer()
{
	if(buffer.length > 100)
		buffer.pop();
	buffer.unshift(msgInputLine.value);

	currentBufferIndex = -1;
}

function loadBuffer(idx)
{
	msgInputLine.value = buffer[idx];
}

function openChat(insertSlash) {
	insertSlash = insertSlash || false;
	clearTimeout(timeout);
	if (!chatOpened) {
		document.querySelector('.chatbox').classList.add('active');
		msgSuggestionsBlock.querySelector('ul').innerHTML = "";
		msgSuggestionsBlock.style.display = "none";

		if (autoHideChat) {
			if (currHideTO != null)
				clearTimeout(currHideTO);
			fadeIn(document.querySelector('.chatbox'), 1);
		}
		msgInputBlock.style.display = 'block';
		msgInputBlock.style.opacity = 1;

		if(insertSlash)
			msgInputLine.value = '/';
		msgInputLine.focus();
		chatOpened = true;
	} else {
		return false;
	}
}
alt.on('openChat', openChat);

function closeChat() {
	if (chatOpened) {
		if(document.querySelector('.chatbox').classList.contains('active'))
			document.querySelector('.chatbox').classList.remove('active');
		msgInputLine.blur();
		msgInputBlock.style.display = 'none';
		if (autoHideChat) {
			if (currHideTO != null)
				clearTimeout(currHideTO);
			currHideTO = setTimeout(() => {
				fadeOut(document.querySelector('.chatbox'), 5);
			}, 3000);
		}
		chatOpened = false;
	} else {
		return false;
	}
}
alt.on('closeChat', closeChat);

function highlightChat() {

	scrollTo(document.querySelector('.msglist'), document.querySelector('.msglist').scrollHeight, 0);

	if (!chatHighlighted) {
		document.querySelector('.chatbox').classList.add('active');
		chatHighlighted = true;
	}

	clearTimeout(timeout);
	timeout = setTimeout(function() {
		if(document.querySelector('.chatbox').classList.contains('active'))
			document.querySelector('.chatbox').classList.remove('active');
		chatHighlighted = false;
	}, 4000);
}

function hideChat(state) {
	document.querySelector('.content').style.display = state ? 'none' : 'block';
}
alt.on('hideChat', hideChat);

document.querySelector('#message').addEventListener('submit', function(e) {
	e.preventDefault();
	var message = msgInputLine.value;
	alt.emit('chatmessage', message);
	saveBuffer();
	msgInputLine.value = '';
	closeChat();
});

function addCommand(cmd) {
	commands.push(cmd);
}
alt.on('addCommand', addCommand);

function setCommands(cmds) {
	commands = cmds;
}
alt.on('setCommands', setCommands);

function handleSuggestions() {
	const message = document.querySelector('.msginput input').value

	// Auto hide and clear if no suggestion or message became empty
	msgSuggestionsBlock.querySelector('ul').innerHTML = "";
	msgSuggestionsBlock.style.display = 'none';

	// If not a command or too small then break (Spam Prevention)
	if (message.length <= 2 || message[0] != '/')
		return;

	const val = message.substring(1).split(' ');
	// create temp func instead of duplicating code
	let addParam = function(cmd, el) {
		cmd.params.forEach((p) => {
			el.innerText += ` [${p.name}${(!p.required) ? '?' : ''}]`
		});
		return el;
	}
	// If user add space, then he chose the command so just display help for this cmd then break
	if (val.length > 1) {
		let cmd = commands.find(x => x.name == val[0]);
		if (cmd == null)
			return;
		let child = document.createElement('li');
		child.innerText = `/${cmd.name}`;
		addParam(cmd, child);
		const currParam = val.length - 2;
		if (cmd.params[currParam] != null) {
			child.innerHTML += `<span>${cmd.params[currParam].help}</span>`
		}
		msgSuggestionsBlock.querySelector('ul').appendChild(child);
		msgSuggestionsBlock.style.display = 'block';
		return;
	}
	let suggestions = [];
	let count = 0;
	commands.forEach((cmd) => {
		// Prevent more than 10 suggestions to not end out of screen
		if (count > 10)
			return;
		if (cmd.name.indexOf(val[0]) != -1) {
			suggestions.push(cmd);
			count++;
		}
	});
	if (suggestions.length <= 0)
		return;
	suggestions.forEach((s) => {
		let child = document.createElement('li');
		child.innerText = `/${s.name}`;
		addParam(s, child);
		child.innerHTML += `<span>${s.help}</span>`
		msgSuggestionsBlock.querySelector('ul').appendChild(child)
	});
	msgSuggestionsBlock.style.display = 'block';
}

function clearChat() {
	messagesBlock.innerHTML = '';
}
alt.on('clearChat', clearChat);

document.querySelector('.msginput input').addEventListener('keydown', function(e) {
	if (e.keyCode === 9) {
		e.preventDefault();
	}
	else if (e.keyCode == 40) {
		e.preventDefault();
		if(currentBufferIndex > 0) {
			loadBuffer(--currentBufferIndex);
		}
		else {
			currentBufferIndex = -1;
			msgInputLine.value = '';
		}
	}
	else if (e.keyCode == 38) {
		e.preventDefault();
		if(currentBufferIndex < (buffer.length - 1)) {
			loadBuffer(++currentBufferIndex);
		}
	}

});

// Handle Suggestions
document.querySelector('.msginput input').addEventListener('keyup', function(e) {
	if (e.key != "Enter")
		handleSuggestions();
});

