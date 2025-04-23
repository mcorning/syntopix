import readline from 'readline';

// Define the tab size in spaces
const TAB_SIZE = 2;

// Helper function to log with indentation
function tabbed(message, indentLevel = 1) {
  const indentation = ' '.repeat(TAB_SIZE * indentLevel);
  console.log(`${indentation}${message}`);
}

// Helper function to create indentation
function getIndentation(indentLevel = 1) {
  return ' '.repeat(TAB_SIZE * indentLevel);
}

// ask function with Ctrl+C handling to close `rl` gracefully
function ask(query, defaultValue, indentLevel = 1) {
  const prompt = defaultValue ? `${query} [${defaultValue}] ` : `${query} `;

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(getIndentation(indentLevel) + prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}
// Function to close the readline interface (used for exit)
function closeInterface() {
  process.stdin.pause();
}

function pause(arg) {
  // pass through any args needed after pause()
  return ask('Enter continues').then(() => arg);
}

export  {

  ask,
  closeInterface,
  pause,
  tabbed,
};
