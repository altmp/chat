# alt:V Chat

You can start by adding the chat resource in its own folder called 'chat'.
```
altVServerFolder/
└── resources/
    ├── chat/
    |   ├── index.mjs
    |   ├── client.mjs
    |   ├── resource.cfg
    |   └── html/
    └── your_resource/
        ├── your_resource_main.mjs
        ├── your_resource_client.mjs
        └── your_resource.cfg
```

**This is for YOUR resource that you want to implement the chat resource into.**
resource.cfg
```
type: js,
main: your_resource_main.mjs
client-main: your_resource_client.mjs
client-files: [],
deps: [
    chat
]
```

### General Usage

**Serverside**
```
import * as chat from 'chat';

// Uses the chat resource to register a command.
// Sends a chat message to the player with their position information.
chat.registerCmd('pos', (player, args) => {
    chat.send(player, `X: ${player.pos.x}, Y: ${player.pos.y}, Z: ${player.pos.z}`);
    
    // Sends to all players.
    chat.broadcast(`${player.name} is located at: ${player.pos.x}, Y: ${player.pos.y}, Z: ${player.pos.z}`);
});
```

**registerCmd definition:**
```ts
registerCmd(commandName: string, callback: Function, isAdmin: boolean? = false, datas? = Object);
```
 - commandName: The name of the command you want to add, ex: 'veh' will result in the command /veh
 - callback: The function executed when a player use this command (give you the player who execute it and everything than he write after in an array splitted by space)
 - isAdmin: Set it to true if you want to prevent anyone from using this command, only socialId who are in the array in index.mjs: `const admins = [];` will be able to execute it (Not required, default to false)
 - datas: An object with the following structure :
    - `help`: (string) a small message that will be shown to players to explain what will do the command
    - `params`: (Array) an array of objects containing the command parameters
    The structure of the object is :
        - `name`: (string) name of the param
        - `required`: (boolean) if the param is required or not
        - `help`: (string) a small message to explain what it's purpose

