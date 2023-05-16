import fs from 'fs';
import { parse } from 'csv-parse/sync';

const input = fs.readFileSync("employees.csv", "utf-8");
const records = parse(input, { columns: true });

function splitArrayWithArrow(array) {
  let arrayHalf = Math.ceil(array.length / 2);
  let firstHalf = array.slice(0, arrayHalf);
  let secondHalf = array.slice(arrayHalf);
  return [firstHalf.join(' -> '), secondHalf.join(' -> ')];
}



let plantUMLCode = '@startuml\n';
plantUMLCode += 'digraph org_chart {\n';
plantUMLCode += '\n';
plantUMLCode += 'graph  [splines="ortho" fontsize=12 fontname="Arial"]\n';
plantUMLCode += 'edge [style="bold" arrowhead="none"]\n';
plantUMLCode += '\n';
plantUMLCode += '/* managing director */\n';
plantUMLCode += 'node [shape="box" style="filled,rounded" fontsize="12" fontname="Arial" fillcolor="green" fontcolor="white" color="white" ]\n';

// process MD records
let mdExecuted = false;
let gfnumber = 0;
let gfArray = [];

records.filter(record => record.function === 'MD').forEach((record) => {
  const label = `${record.name}`;
  gfnumber++;
  const gf = `gf${gfnumber}`;
  gfArray.push(gf);
  plantUMLCode += `${gf} [label="${label}"]\n`;
  mdExecuted = true;
});


if (mdExecuted) {
  const gfString = gfArray.join();
  let [firstHalf, secondHalf] = splitArrayWithArrow(gfArray);
  plantUMLCode += 'node [shape=point height=0 width="" label="" fillcolor="white" color="black"]\n';
  plantUMLCode += 'mandir\n';
  plantUMLCode += `{rank=same; ${gfString},mandir}\n`;
  plantUMLCode += `${firstHalf} -> mandir -> ${secondHalf}\n`;
  plantUMLCode += '\n';
  plantUMLCode += '/* director */\n';
  plantUMLCode += 'node [shape="box" style="filled,rounded" fontsize="12" fontname="Arial" fillcolor="green" fontcolor="white" color="white" width="" height=""]\n';
}

// process Di records
let diExecuted = false;
let dinumber = 0;
let diArray = [];

records.filter(record => record.function === 'Di').forEach((record) => {
  if (mdExecuted) {
    dinumber++;
    const di = `di${dinumber}`;
    diArray.push(di);
    plantUMLCode += `${di} [label="${record.name}\\n${record.department}"]\n`;
    diExecuted = true;
  }
});


if (diExecuted) {
  const diString = diArray.join();
  let [firstHalf, secondHalf] = splitArrayWithArrow(diArray);
  plantUMLCode += 'node [shape=point height=0 width="" label="" fillcolor="white" color="black"]\n';
  plantUMLCode += 'dir\n';
  plantUMLCode += `{rank=same; ${diString},dir}\n`;
  plantUMLCode += `${firstHalf} -> dir -> ${secondHalf} [style="invis"]\n`;
  plantUMLCode += '\n';
  plantUMLCode += '/* business unit */\n';
  plantUMLCode += 'node [shape="box" style="filled,rounded" fontsize="12" fontname="Arial" fillcolor="green" fontcolor="white" color="white" width="" height=""]\n';
}

// process Bu records
let buExecuted = false;
let bunumber = 0;
let buArray = [];

records.filter(record => record.function === 'Bu').forEach((record) => {
  if (diExecuted) {
    const label = `${record.name}`;
    let department = `${record.department}`;
    bunumber++;
    const bu = `bu${bunumber}`;
    buArray.push(bu);
    plantUMLCode += `${bu} [label="Business Unit\\n${department}\\n${label}"]\n`;
    buExecuted = true;
  }
});

if (buExecuted) {
  const buString = buArray.join();
  let [firstHalf, secondHalf] = splitArrayWithArrow(buArray);
  plantUMLCode += 'node [shape=point height=0 width="" label="" fillcolor="white" color="black"]\n';
  plantUMLCode += 'bu\n';
  plantUMLCode += `{rank=same; ${buString},bu}\n`;
  plantUMLCode += `${firstHalf} -> bu -> ${secondHalf} [style="invis"]\n`;
  plantUMLCode += '\n';
  plantUMLCode += '/* Teams */\n';
  plantUMLCode += ' node [shape="box" style="filled" fontsize="12" fontname="Arial" fillcolor="orange" fontcolor="black" color="black"]\n';
}

// process Te records

let teExecuted = false;
let tenumber = 0;
let teArray = [];

const teRecords = records.filter(record => record.function === 'Te');


const department2Tags = [...new Set(records.map(record => record.department2))];
// This creates an array of all unique department2 tags from the records

department2Tags.forEach(tag => {
  if (tag !== "none") {
    const recordsWithSameTag = records.filter(record => record.department2 === tag);
    // This filters all records that have the same department2 tag
    recordsWithSameTag.forEach((record) => {
      if (buExecuted) {
        let department = record.department1;
        tenumber++;
        const te = `team${tenumber}`;
        teArray.push(te);
        let team = [];
        records.filter(record => record.function === 'Em' && (record.department1 === department || record.department2 === department)).forEach((record) => {
          let name = record.name;
          let emLabel = [name];
          team.push(emLabel);

        });
        let teamString = team.join('<br/>\n');
        plantUMLCode += `${te} [label=<<br/>\n<br/>\n<b>${department}</b><br/>\n<br/>\n${teamString}<br/>\n>]\n`;
        teExecuted = true;
      }
    });
  }
});

// arrows from managing director to director
if (teExecuted) {
  const diNorth = diArray.map(di => di + 'n');
  plantUMLCode += '\n';
  plantUMLCode += '/* connections gf -> d */\n';
  plantUMLCode += 'node [shape="point" height=0 width=0]\n';
  plantUMLCode += 'mandirs\n';
  plantUMLCode += 'dirn\n';
  plantUMLCode += `${diNorth}\n`;
  plantUMLCode += `{rank=same; ${diNorth}n; dirn}\n`;
  for (let i = 0; i < diArray.length; i++) {
    let di = diArray[i];
    let dirn = diNorth[i];
    plantUMLCode += `${di} -> ${dirn}\n`;
  }
  plantUMLCode += 'mandir -> mandirs\n';
  plantUMLCode += 'mandirs -> dirn\n';
  let [firstHalf, secondHalf] = splitArrayWithArrow(diNorth);
  plantUMLCode += `${firstHalf} -> dirn -> ${secondHalf}\n`;
  plantUMLCode += '\n';
}

// arrows from director to business unit
const diSouth = diArray.map(di => di + 's');
const buNorth = buArray.map(bu => bu + 'n');
plantUMLCode += '/* connections d -> bu */\n';
plantUMLCode += 'node [shape=point height=0 width="" label="" fillcolor="white" color="black"]\n';
plantUMLCode += `${diSouth}\n`;
plantUMLCode += `{rank=same; ${diSouth}}\n`;
plantUMLCode += `${buNorth}\n`;
plantUMLCode += `{rank=same; ${buNorth}}\n`;
for (let i = 0; i < diArray.length; i++) {
  let di = diArray[i];
  let dis = diSouth[i];
  plantUMLCode += `${di} -> ${dis}\n`;
}

for (let i = 0; i < buArray.length; i++) {
  let bu = buArray[i];
  let bun = buNorth[i];
  plantUMLCode += `${bun} -> ${bu}\n`;
}

// Create an object for each unique department2 tag containing an array of business units
const buByDepartment2 = {};
bunumber = 0;
let diSouthNum = 0;
department2Tags.forEach(tag => {
  if (tag !== "none") {
    // Filter all records that have the same department2 tag
    const recordsWithSameTag = records.filter(record => record.department2 === tag);

    // Create an array of business units that share the same department2 tag
    const buArray = [];

    recordsWithSameTag.forEach((record) => {
      if (record.function === "Bu") {
        bunumber++;
        buArray.push("bu" + bunumber + "n");
      }
    });

    // Add the array of business units to the object
    buByDepartment2[tag] = buArray;
    let buByDi = buArray.join(" -> ")
    let diSouth = diArray.map(di => di + 's');
    diSouthNum++;
    plantUMLCode += `${buByDi}\n`
    plantUMLCode += `d${diSouthNum}s -> ${buByDi[1]}\n`
    plantUMLCode += `\n`
  }
});

plantUMLCode += '}\n';
plantUMLCode += '@enduml\n';

console.log(plantUMLCode);

fs.writeFileSync("org_chart.puml", plantUMLCode, "utf-8");
