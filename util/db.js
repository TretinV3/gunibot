const fs = require("fs")

module.exports = (client) => {
    client.db = {}
    
    client.db.get = (id) => {
        if(!id) return false;
        if(!fs.existsSync(`./db/${id}.json`)) return false;

        const config = JSON.parse(fs.readFileSync(`./db/${id}.json`));

        client.db[id] = config;

        return config;

    }

    client.db.set = (id) => {
        if(!id) return false;
        if(!fs.existsSync(`./db/${id}.json`)) return false;
        fs.writeFileSync(`./db/${id}.json`, JSON.stringify(client.db[id], null, 3))
    }

}