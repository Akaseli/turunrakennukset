import express from 'express';
import pg from 'pg';
import cors from 'cors';
import NodeCache from 'node-cache';
import { update } from './databaseUpdate.js';
const app = express();

const { Pool } = pg

//24 tuntia
const updateData = setInterval(update, 7 * 24 * 60 * 60 * 1000);

function StartUpdate(){
    update(false);
    dataUpdated = Date.now()
}

//Käynnistäessä hakee tuoreimman datan
let dataUpdated = 0;

//1 tuntia
const cacheTime = 60 * 60 * 1

const cache = new NodeCache({
    stdTTL: cacheTime,
    useClones: false,
    checkperiod: 1
});

const port = 4000;

app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200
};

const pool = new Pool({
  user: process.env.DBUSER,
  host: process.env.DBHOST,
  database: process.env.DBNAME,
  password:  process.env.DBPASS,
  port: process.env.DBPORT
})

app.get('/buildings', cors(corsOptions), (req, res) => {
    if(cache.get(req.url)){
        res.status(200).json(cache.get(req.url));
    }
    else{
        pool.query('SELECT * FROM building_info WHERE location IS NOT NULL', (error, results) => {
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
    StartUpdate()
    dataUpdated = Date.now()
});