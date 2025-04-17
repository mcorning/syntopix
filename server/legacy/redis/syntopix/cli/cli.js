// console.clear();
// const { isEmpty, keysMan, initializePk } = require('../../../../src/js/helpers');
const { isEmpty, keysMan, initializePk } = require('../helpers');

const {  setPk } = require('./cliStorage');

const { getNamespace } = require('../../config/redisNamespace');
const { redis } = require('../../setup');

const { ask, pause, tabbed } = require('../commands/readline');

// Command Handlers
const { listTopicSpaces } = require('../commands/topic');
const addTopic = require('../commands/add');
const { moveTopic } = require('../commands/move');
const { scanCommand } = require('../commands/scan');
const { deleteMySpace, spaceTopics } = require('../commands/space');
const { displaySpaces } = require('../spaceMan');

redis.on('ready', () => {
  console.log('Redis is ready in cli.js!');
});

let isPromptRestarting = false;
const pk = initializePk(); // Retrieve or create pk at startup

const namespace = getNamespace();

// let keysMan;
// try {
//   keysMan = generateKeysMan();
// } catch (err) {
//   console.error('Error generating keysMan:', err);
//   process.exit(1);
// }

const line = '-------------------------------------------';
// Context-Aware Command Map
const commandMap = {
  default: [
    {
      label: 'Move',
      intention: "\t\tChange a Topiq's Space(s)",
      handler: (keysMan, topics, spaces) => moveTopic(keysMan, topics, spaces),
      lined: true,
    },
    {
      label: 'Add',
      intention: '\t\tAdd a Topiq',
      handler: (keysMan) => addTopic(keysMan),
    },
    {
      label: 'Delete',
      intention: '\tDelete your Space',
      handler: (keysMan) => deleteMySpace(keysMan),
      lined: true,
    },
    {
      label: 'Set PK',
      intention: '\tAdd or Change PK',
      handler: (keysMan) => setPkCommand(keysMan),
      lined: true,
    },
    {
      label: 'Scan',
      intention: '\t\tList Topiqs & Spaces',
      handler: (keysMan) => scanCommand(keysMan),
    },
    {
      label: 'Space',
      intention: '\tList Topiqs held in a Space',
      handler: (keysMan) => spaceTopics(keysMan),
    },
    {
      label: 'Topic',
      intention: '\tList Spaces holding a Topiq',
      handler: (keysMan) => listTopicSpaces(keysMan),
    },
  ],
  obx: [
    {
      label: 'Add',
      intention: '\t\tAdd a Topiq',
      handler: (keysMan) => addTopic(keysMan),
      lined: true,
    },
    {
      label: 'Set PK',
      intention: '\tAdd or Change PK',
      handler: (keysMan) => setPkCommand(keysMan),
    },
  ],
  noSpaces: [
    {
      label: 'Move',
      intention: "\t\tChange a Topiq's Space(s)",
      handler: (keysMan, topics, spaces) => moveTopic(keysMan, topics, spaces),
      lined: true,
    },
    {
      label: 'Add',
      intention: '\t\tAdd a Topiq',
      handler: (keysMan) => addTopic(keysMan),
    },

    {
      label: 'Set PK',
      intention: '\tAdd or Change PK',
      handler: (keysMan) => setPkCommand(keysMan),
    },
  ],
};

function handleCommand(commandIndex, availableCommands, topics, spaces) {
  const command = availableCommands[commandIndex];
  if (!command) {
    console.log('Invalid command. Please try again.');
    return Promise.resolve(false); // Return false for invalid commands
  }

  tabbed(`Executing Command: ${command.label}`);

  return command
    .handler(keysMan, topics, spaces)
    .then((result) => {
      if (result === false) {
        console.log('\nReturning to command list...');
      }
      return pause().then(() => result);
    })
    .catch((err) => {
      if (err.message === 'Command Abandoned') {
        console.log('\nCommand abandoned. Returning to command list...');
        return false; // Return false to indicate graceful abandonment
      }
      throw err; // Re-throw unexpected errors
    });
}

function setPkCommand(keysMan) {
  return ask('Enter a new PK: ', `${Date.now()}-0`).then((newPk) => {
    if (!newPk.trim()) {
      console.log('Invalid PK. Please try again.');
      return;
    }

    // Update the PK
    setPk(newPk.trim());
    keysMan.pk = newPk.trim(); // Update the keysMan object dynamically
    keysMan.pkTopicsKey = `${namespace}:pks:${keysMan.pk}:topics`;
    keysMan.pkSpacesKey = `${namespace}:pks:${keysMan.pk}:spaces`;

    console.log(`Author's PK successfully changed to: ${newPk}`);
  });
}

function displayCommands(topics, spaces) {
  const isOBX = isEmpty(topics); // Check if OBX (no Topics exist)
  const noSpaces = isEmpty(spaces) ? 'noSpaces' : 'default';
  const key = isOBX ? 'obx' : noSpaces;
  const availableCommands = commandMap[key];

  console.log('\nAvailable commands:');
  console.log('===========================================');
  availableCommands.forEach(({ label, intention, lined }, index) => {
    console.log(`${index + 1}: ${label}${intention}`);
    if (lined) {
      console.log(line);
    }
  });
  console.log(line);
  console.log('Enter a number (or "q" to quit):');
  return { topics, availableCommands, spaces };
}

function startPrompt() {
  if (isPromptRestarting) return;

  isPromptRestarting = true;
  console.log('\n\n');
  tabbed('--->  Starting Workflow  <---', 2);

  console.log(`Current Context:\nAuthor ${keysMan.pk}`);

  listTopicSpaces(keysMan) // Query Topics for the PK
    .then((topics) => {
      if (isEmpty(topics)) {
        console.log('\n');
        tabbed(
          "NOTE|   You have no Topics yet. Use the 'Add' command to create one."
        );
        return topics;
      }
      return topics;
    })
    .then((topics) =>
      displaySpaces({ pk, pkSpacesKey: keysMan.pkSpacesKey, topics }).then(
        ({ topics, spaces }) => ({ topics, spaces })
      )
    )
    .then(({ topics, spaces }) => displayCommands(topics, spaces))
    .then(({ topics, spaces, availableCommands }) => {
      ask('Your command: ')
        .then((input) => {
          if (input?.trim().toLowerCase() === 'q') {
            console.log('Exiting the application. Goodbye!');
            process.stdin.pause();
            process.exit(0);
          }

          const commandIndex = parseInt(input, 10) - 1;
          return handleCommand(commandIndex, availableCommands, topics, spaces);
        })
        .then(() => {
          isPromptRestarting = false;
          startPrompt(); // Re-display the prompt
        });
    });
}

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  if (data === '\u0003') {
    console.log('\nCommand abandoned. Returning to main prompt.');
    if (!isPromptRestarting) {
      isPromptRestarting = true;

      startPrompt();
    }
  }
});

startPrompt();
