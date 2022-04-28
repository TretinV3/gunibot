const fs = require("fs")

module.exports = () => {


    console.log(`\n\n\n\n\n\n\n`);

    var oldLog = console.log;
    console.log = async function () {
        const date = `[${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}, ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}]`;
        
        if(!arguments[0]) arguments[0] = "";

        oldLog(`${date} ${arguments[0]}`);

        addToLog(`${date} ${arguments[0]}`)
    }

    function addToLog(text){
        const log = fs.readFileSync('./.log');
        fs.writeFileSync('./.log', `${log}\n${text}`)
    }

    addToLog('')
}