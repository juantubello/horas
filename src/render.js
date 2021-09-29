const electron = require("electron");
const path = require('path');
const clipboard =  electron.clipboard;
const remote = electron.remote;
const dialog = remote.dialog;
const XLSX = require('xlsx');

let tableHeaders = [];
let totalRows = 0;
let totalCells = 0;

startBtn.onclick = async e => {
    totalRows = 0;
    totalCells = 0;
    tableHeaders = [];

    let res = await getPath();

    if (res.pathNotEmpty) {
        console.log(res.path[0]);
        pathroute = res.path[0];
        path.format({ ...path.parse(pathroute), base: undefined, ext: '.xlsx' });
    }
    if (!res.pathNotEmpty) {
        console.log(res.path);
    }

    let workbook = XLSX.readFile(pathroute);

    var sheet_name_list = workbook.SheetNames;
    let arr = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    let keys;
    for (var key in arr) {
        let json = arr[key];
        keys = Object.keys(json);
        break;
    }

    const objectArray = Object.entries(keys);

    objectArray.forEach(([key, value]) => {
        tableHeaders.push(value);
    });

    let arrAux = tableHeaders.slice(0);
    arrAux.shift();
    arrAux.pop();
    totalCells = arrAux.length;

    const scoreDiv = document.querySelector("div.scoreboard") // Find the scoreboard div in our html
    // let tableHeaders = ["Global Ranking", "Username", "Score", "Time Alive [seconds]", "Accuracy [%]", "TEST2", "TEST3", "TEST34", "TEST53"]
    const createScoreboardTable = () => {
        while (scoreDiv.firstChild) scoreDiv.removeChild(scoreDiv.firstChild) // Remove all children from scoreboard div (if any)
        let scoreboardTable = document.createElement('table') // Create the table itself
        scoreboardTable.className = 'scoreboardTable'
        let scoreboardTableHead = document.createElement('thead') // Creates the table header group element
        scoreboardTableHead.className = 'scoreboardTableHead'
        let scoreboardTableHeaderRow = document.createElement('tr') // Creates the row that will contain the headers
        scoreboardTableHeaderRow.className = 'scoreboardTableHeaderRow'
        // Will iterate over all the strings in the tableHeader array and will append the header cells to the table header row
        tableHeaders.forEach(header => {
            let scoreHeader = document.createElement('th') // Creates the current header cell during a specific iteration
            scoreHeader.innerText = header
            scoreboardTableHeaderRow.append(scoreHeader) // Appends the current header cell to the header row
        })
        scoreboardTableHead.append(scoreboardTableHeaderRow) // Appends the header row to the table header group element
        scoreboardTable.append(scoreboardTableHead)
        let scoreboardTableBody = document.createElement('tbody') // Creates the table body group element
        scoreboardTableBody.className = "scoreboardTable-Body"
        scoreboardTable.append(scoreboardTableBody) // Appends the table body group element to the table
        scoreDiv.append(scoreboardTable) // Appends the table to the scoreboard div
    }

    // The function below will accept a single score and its index to create the global ranking
    const appendScores = (rows) => {
        const scoreboardTable = document.querySelector('.scoreboardTable') // Find the table we created
        let scoreboardTableBodyRow = document.createElement('tr') // Create the current table row
        scoreboardTableBodyRow.className = 'scoreboardTableBodyRow'
        // Lines 72-85 create the 5 column cells that will be appended to the current table row

        // let rows = ['Molinos', '8', '9']

        rows.forEach(function (row) {
            let newRow = document.createElement('td')
            newRow.innerText = row
            scoreboardTableBodyRow.append(newRow)
        });
        scoreboardTable.append(scoreboardTableBodyRow) // Append the current row to the scoreboard table body
        totalRows += 1;
    }

    createScoreboardTable();

    for (var key in arr) {
        let rows = []
        console.log(arr[key])
        let obj = arr[key];
        const objectArray = Object.entries(obj);
        objectArray.forEach(([key, value]) => {
            rows.push(value);
        });
        appendScores(rows)
    }

    appendScores() // Creates and appends each row to the table body
    // appendScores(score, scoreIndex) // Creates and appends each row to the table body

};

stopBtn.onclick = e => {

    if (isTarifaEmpty()) {
        messageTarifa()
    }
    else {
        let tarifa = document.getElementById("tarifa").value;
        let horas = 0;

        console.log(totalRows)
        console.log(totalCells)
        var table = document.getElementById("myTable")

        for (let i = 1; i <= totalCells; i++) {
            let suma = 0;
            for (let j = 1; j <= totalRows; j++) {
                let valor = parseInt(table.childNodes[0].rows[j].cells[i].innerHTML);
                if (isNaN(valor)) valor = 0;
                suma = suma + valor;
            }
            console.log('Index {' + i + '} ->' + suma);

            if (suma > 8) {
                horas = horas + (suma - 8);
            }
            suma = 0;
        }
        console.log(horas);
        document.getElementById("hourvalue").innerHTML = horas;
        const options2 = { style: 'currency', currency: 'ARS' };
        const formatCurrency = new Intl.NumberFormat('es-AR', options2);
        document.getElementById("moneyvalue").innerHTML = formatCurrency.format(horas * tarifa);
    }
};

clearBtn.onclick = e => {

    const scoreDiv = document.querySelector("div.scoreboard")
    while (scoreDiv.firstChild) scoreDiv.removeChild(scoreDiv.firstChild)
    document.getElementById("hourvalue").innerHTML = 0;
    const options2 = { style: 'currency', currency: 'ARS' };
    const formatCurrency = new Intl.NumberFormat('es-AR', options2);
    document.getElementById("moneyvalue").innerHTML = formatCurrency.format(0);
    document.getElementById("tarifa").value = '';


};
copyBtn.onclick = async e => {
    let isEmpty;
    let extraH = document.getElementById("hourvalue").innerHTML;

    if(extraH === '' || extraH === 0 || extraH === "0"){
        isEmpty = true
    }
    else{
        isEmpty = false
    }

    if(isEmpty){
        document.getElementById("copyBtn").innerHTML = "❌Not copied";
    }else{
        document.getElementById("copyBtn").innerHTML = "✅Copied";
        const text = 'mis horas extras de este mes fueron ' + extraH + '!';
        clipboard.writeText(text)
    }
    console.log(extraH);

    await resolveAfterSeconds();
    document.getElementById("copyBtn").innerHTML = "📋Copy to clipboard";

};

function getPath() {
    return new Promise(function (resolve, reject) {
        dialog.showOpenDialog(remote.getCurrentWindow(), {
            properties: ["openFile"]
        }).then(result => {
            if (result.canceled === false) {
                console.log("Selected file paths:")
                resolve({ path: result.filePaths, pathNotEmpty: true })
            } else {
                resolve({ path: '', pathNotEmpty: false })
            }
        }).catch(err => {
            reject(err)
        })
    });
}

function isTarifaEmpty() {
    let tarifa = document.getElementById("tarifa").value;
    let isEmpty = tarifa ? false : true;
    return isEmpty;

}
function messageTarifa() {
    dialog.showMessageBox(
        {
            message: "Tenes que cargar una tarifa 🤬",
            buttons: ["OK! Ya la cargo papu 😎"],
            defaultId: 0, // bound to buttons array
        })
}

function resolveAfterSeconds() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('resolved');
      }, 1000);
    });
  }
