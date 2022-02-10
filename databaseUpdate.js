const { default: axios } = require("axios");
const { XMLParser } = require("fast-xml-parser");
const { Pool } = require('pg');
const proj4 = require('proj4')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'buildings',
    password: 'Rasti123',
    port: 5432
})

const options = {
    ignoreAttributes : false,
    attributeNamePrefix : "@_"
};

let parser = new XMLParser(options);

function getValueFromAttributes(list, valueName){
    //console.log(list)
    const matches = list.filter(value => value["@_name"] == valueName)

    if(matches[0] == undefined) return null

    return matches[0]["gen:value"]
}

function parsePoint(list, valueName){
    proj4.defs("EPSG:3877", "+proj=tmerc +lat_0=0 +lon_0=23 +k=1 +x_0=23500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    
    const string = getValueFromAttributes(list, valueName);

    if(string == null) return (0, 0);

    let parts = string.split(" ");

    let latlngParts = proj4("EPSG:3877").inverse([parseFloat(parts[1]), parseFloat(parts[0])]);

    return (latlngParts[1] + "," + latlngParts[0]);
}

module.exports = {
    update: function(returnData){
        console.log("Updating database...")
        axios.get('https://opaskartta.turku.fi/TeklaOGCWeb/WFS.ashx?service=wfs&version=1.1.0&request=GetFeature&TypeName=bldg:Building_LOD0&maxFeatures=9999999')
        .then(async (response) => {
            if(response.status != 200) return; 
    
    
            //Poistaa ja luo uudelleen tablen |TODO: Parempi ratkaisu?
            await pool.query("DROP TABLE IF EXISTS building_info;")
            await pool.query("CREATE TABLE building_info(id text, dateadded date, floorcount integer, propertyid bigint, buildingid text, permanentbuildingid text, volume double precision, usage text, apartmentcount integer, floorarea double precision, height double precision, measuredheight double precision, supportingmaterial text, buildingstate text, facadematerial text, address text, location point, yearofconstruction integer, lastgeometrychange date, floorsaboveground integer)");
    
    
            let object = parser.parse(response.data);
    
            //Vastauksen joka talolle
            object["wfs:FeatureCollection"]["gml:featureMember"].forEach(building => {
                const buildingData = building["bldg:Building"];
                const query = "INSERT INTO building_info(id, dateadded,floorcount,propertyid, buildingid, permanentbuildingid, volume, usage, apartmentcount, floorarea, height, measuredheight, supportingmaterial, buildingstate, facadematerial, address, location, yearofconstruction, lastgeometrychange, floorsaboveground) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)";
                const values = [
                    buildingData["@_gml:id"],
                    buildingData["gen:dateAttribute"]["gen:value"],
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennuksen kerrosten maara"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "kiinteistotunnus"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennustunnus"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "pysyva rakennustunnus"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennuksen tilavuus"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "käyttötarkoitus"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennuksen huoneistojen lukumaara"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennuksen kerrosala"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennuksen korkeus"),
                    buildingData["bldg:measuredHeight"]["#text"],
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "kantava rakennusaine"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennuksen tila"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennuksen julkisivumateriaali"),
                    getValueFromAttributes(buildingData["gen:stringAttribute"], "osoite"),
                    parsePoint(buildingData["gen:stringAttribute"], "sijainti"),
                    buildingData["bldg:yearOfConstruction"],
                    buildingData["gen:dateAttribute"]["gen:value"],
                    buildingData[ "bldg:storeysAboveGround"]
                ];
    
                pool.query(query, values);
            });
        });
    }
}


