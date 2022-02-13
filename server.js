const express = require('express');
const { Pool } = require('pg');
const cors = require('cors')
const NodeCache = require('node-cache');
const dbUpdate = require('./databaseUpdate');

const app = express();

//24 tuntia
const updateData = setInterval(update, 86400000);

function update(){
    dbUpdate.update(false);
    dataUpdated = Date.now()
}

//Käynnistäessä hakee tuoreimman datan
let dataUpdated = 0;

//1 tuntia
const cacheTime = 60 * 60 * 1

const cache = new NodeCache({
    stdTTL: cacheTime,
    useClones: false,
    checkperiod: 3600
});

const port = 4000;

app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
};

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'buildings',
    password: 'Rasti123',
    port: 5432
});

app.get('/buildings', cors(corsOptions), (req, res) => {
    if(cache.get(req.url)){
        res.status(200).json(cache.get(req.url));
    }
    else{
        pool.query('SELECT * FROM building_info', (error, results) => {
            if(error){
                throw error;
            }

            cache.set(req.url, results.rows);
            res.status(200).json(results.rows);
        });
    }
});

app.get('/info', cors(corsOptions), (req, res) => {
    if(cache.get(req.url)){
        res.status(200).json(cache.get(req.url));
    }
    else{
        pool.query('SELECT DISTINCT usage FROM building_info', (error, results) => {
            if(error){
                throw error;
            }
    
            const response = results.rows.map((result) => {
                return result["usage"];
            });
            cache.set(req.url, [response, dataUpdated]);
            res.status(200).json([response, dataUpdated]);
        });
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    dbUpdate.update();
    dataUpdated = Date.now()
});