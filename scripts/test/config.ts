#!/usr/bin/env node

const chalk = require('chalk'); // import * as chalk from 'chalk';

console.clear();

export const content = `
//  Goods
// --------------------------------------------------------------------------------

"app":{"name":""}
"app":{"name":"","id":123}
"app":{"id":123,"name":""}
"app" : { "name" : "" }
"app": { "name" : "hola" }
"app": { "name" : "hola",}
"app": { "name" : "hola", }
"app": { "name" : "hola", "id": 123 }
"app": { "id": 123, "name": "" }

"app" : {
  "name" : ""
}

"app" : {
  "name" : "",
  "id: 123
}

"app" : {
  "id: 123,
  "name" : "",
}


//  Bads
// --------------------------------------------------------------------------------

"apps":{"name":""}
"app":{"names":""}
"sapp":{"name":""}
"app":{"sname":""}
"apps" : { "name": "" }
"app": { "names": "" }
"sapp": { "name": "" }
"app": { "sname": "" }
"app": { name": "" }
"app": { "name: "" }

"appa" : {
  "name" : ""
}
"sapp" : {
  "name" : ""
}

"sapp" : {
  "namea" : "",
  "id: 123
}

"appa" : {
  "id: 123,
  "names" : "",
}

`;


// const search = new RegExp(`((?:import[^}]*)(?: |\n|\t|,|\{)${specifier}(?= |,|\n|\})[^;]*(?:\'${source}\'[ ]*;))`, 'g');
// const replace = `▓\$1▓`;

// const replace = `▓\$1▒\$2▒\$3▓`;

// const search = new RegExp(`((?:import[^}]*))((?: |\n|\t|,|\{))(${specifier}(?= |,|\n|\}))([^;]*)((?:\'${source}\'[ ]*;))`, 'g');
// const search = new RegExp(`((?:import[ \n\t]*\{))([^}]*)([^;]*;)`, 'g');
// const search = new RegExp(`((?:import[ \n\t]*\{))([^}]*)([^;]*)((?:\'${source}\'[ ]*;))`, 'g');
// const search = new RegExp(`((?:import[ \n\t]*))((?:[^}]*)?(?: |,|\n|\{){1}(?:${specifier})(?= |,|\n|\})(?:[^}]*)?\})((?:[ \n\t]+)from(?:[ \n\t]+)(?:\'${source}\'[ ]*;))`, 'g');

// const search = new RegExp(`((?:import[^{]*)\{})((?:[\n\t\s\w, ]*))(?: |\n|\t|,|\{))(${specifier}(?= |,|\n|\}))([^;]*)((?:\'${source}\'[ ]*;))`, 'g');
// const replace = `▓\$1▒\$2▒\$3▒\$4▒\$5▓`;

const projectName = 'excel-taxi';
// const search = new RegExp(`((?:name):\s*\")((?:${projectName}(?=\"))`);
// const search = new RegExp(`((?:name):\s*\")((?:${projectName}(?=\"))`);
const search = new RegExp(`((?:\"app\")(?:[ \n\t]*)?(?:\:)(?:[ \n\t]*)?\{(?:[ \n\t]*)?)((?:\"name\")(?:[ \n\t]*)?(?:\:))`, 'g');
// const search = new RegExp(`((?:name):\s*\")((?:${projectName}(?=\"))`, 'g');

// const replace = `▓\$1▓`;
const replace = `▓\$1▒\$2▓`;
// const replace = `▓\$1▒\$2▒\$3▓`;
// const replace = `▓\$1▒\$2▒\$3▒\$4▓`;
// const replace = `▓\$1▒\$2▒\$3▒\$4▒\$5▓`;

const result = content.replace(search, replace);
console.log(chalk.grey(result));
