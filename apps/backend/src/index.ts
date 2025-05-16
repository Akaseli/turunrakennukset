import express from 'express';
import pg from 'pg';
import cors from 'cors';
import NodeCache from 'node-cache';
import compression from 'compression';
import path from 'path';
import { update } from './databaseUpdate';
const app = express();

const { Pool } = pg

//7 päivää
const updateData = setInterval(update, 7 * 24 * 60 * 60 * 1000);

function StartUpdate(){
    update(false);
    dataUpdated = Date.now()
}

//Käynnistäessä hakee tuoreimman datan
let dataUpdated = 0;

//12 tuntia
const cacheTime = 12 * 60 * 60

const cache = new NodeCache({
    stdTTL: cacheTime,
    useClones: false,
    checkperiod: 3600
});

const port = 4000;

app.use(express.json());
app.use(compression())

if(process.env.PRODUCTION){
  console.log("Serving frontend")
  app.use(express.static(path.join(__dirname, "../frontend")));
}


if(process.env.PRODUCTION){
  app.use(cors({origin: "https://turunrakennukset.akaseli.dev"}))
}
else{
  app.use(cors())
}

const pool = new Pool({
  user: process.env.DBUSER,
  host: process.env.DBHOST,
  database: process.env.DBNAME,
  password:  process.env.DBPASS,
  port: process.env.DBPORT
})

app.get('/api/buildings', (req, res) => {
    if(cache.get("buildings")){
        res.status(200).json(cache.get("buildings"));
    }
    else{
        pool.query('SELECT * FROM building_info WHERE location IS NOT NULL', (error, results) => {
            if(error){
                throw error;
            }

            cache.set("buildings", results.rows);
            res.status(200).json(results.rows);
        });
    }
});

app.get('/api/info', (req, res) => {
    if(cache.get("info")){
        res.status(200).json(cache.get("info"));
    }
    else{
        pool.query('SELECT DISTINCT usage FROM building_info', (error, results) => {
            if(error){
                throw error;
            }
    
            const response = results.rows.map((result) => {
                return result["usage"];
            });
            cache.set("info", [response, dataUpdated]);
            res.status(200).json([response, dataUpdated]);
        });
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    StartUpdate()
    dataUpdated = Date.now()
});