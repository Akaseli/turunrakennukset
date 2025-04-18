import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import pg from 'pg';
import proj4 from 'proj4';
import 'dotenv/config'

const { Pool } = pg



const pool = new Pool({
    user: process.env.DBUSER,
    host: process.env.DBHOST,
    database: process.env.DBNAME,
    password:  process.env.DBPASS,
    port: process.env.DBPORT
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

function parsePoint(list){
    proj4.defs("EPSG:3877","+proj=tmerc +lat_0=0 +lon_0=23 +k=1 +x_0=23500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
    
    const x = getValueFromAttributes(list, "x");
    const y = getValueFromAttributes(list, "y");

    if(x && y){ 
      let latlngParts = proj4("EPSG:3877").inverse([y, x])

      return (latlngParts[1] + "," + latlngParts[0]);
    }
    else{
      const string = getValueFromAttributes(list, "sijainti");

      let parts = string.split(" ");

      let latlngParts = proj4("EPSG:3877").inverse([parseFloat(parts[1]), parseFloat(parts[0])]);
      
      return (latlngParts[1] + "," + latlngParts[0]);
    }

}

function mapUsage(usage){
  switch(usage){
    
    case "1000-1000-1000":
      return "Muutaman asunnon talo"
    case "1000-1000-1010":
      return "Rivi-/Kerrostalo"
    case "1030-1150-1020":
      return "Toimistorakennus"
    case "1030-1150-1050":
      return "Liiketila"
    
    //Selkeä
    case "1040-1240-1240":
      return " Ravintolat, ruokalat ja baarit"

    case "1050-1100-1100":
      //Saunat, erilliset vapaa-ajan asunnot yms yhdistetty
      return "Erilliset vapaa-ajan asunnot"

    case "1060-2550-2550":
      //Yhdistetty taas aika monta samaan
      return "Urheilu";
    
    //Selkeä
    case "1070-2120-2120":
      return "Seurain-, nuoriso- yms. talot"

    case "1080-2210-2210":
      //Yhdistelty seurakuntien yms rakennuksia
      return "Usk. yhteisojen rakennukset"

    case "1090-1070-1070":
      //Sisältää kanalat, eläinsuojat, maa-/metsä-/kalatalousrak, viljakuivaamot yms
      return "Erilaiset maa- ja elintarviketalousrakennukset"
    
    case "1090-1940-1940":
      return "Kasvihuoneet"
    
    case "1100-2070-2070":
      return "Koulu"

    case "1120-1150-1050":
      return "Asuntolat, Muut majoitusrakennukset"

    case "1120-2300-2300":
      return "Terveydenhoito"
    
    case "1120-2340-2340":
      return "Päiväkodit, Vanhainkodit"
    
    case "1130-1760-1760":
      return "Tietoliikenteen rakennukset"
    
    case "729-729-729":
    case "1140-2410-2410":
      return "Paloasemat"
    
    case "1140-2440-2440":
      return "Vankila"
    
    case "1150-1310-1310":
      return "Varastorakennus"

    case "1150-1360-1360":
      return "Huolto-/Talousrakennus"
    
    case "1160-1700-1700":
      return "Voimalaitosrakennukset"
    
    case "161-161-161":
      //Ehkä ennemmin yleisesti vain joukkoliikenne
      return "Rautatie- ja linja-autoasemat"
    
    case "163-163-163":
      return "Kulkuneuvojen suoja- ja huoltor."
    
    case "169-169-169":
      return "Muut liikenteen rakennukset"
    
    case "369-369-369":
      return "Muut kokoontumisrakennukset"

    case "613-613-613":
      return "Yhdyskuntatekniikan rakennukset"
    
    case "691-1310-1310":
      return "Teollisuushallit"
    
    case "692-1310-1310":
      return "Teollisuus- ja pienteoll.talot"
    
    case "699-1310-1310":
      return "Muut teollisuuden tuotantorak"

    case "722-722-722":
      return "Väestonsuojat"
    
    case "10-10-10":
    case "0-0-0":
    case "999-999-999":
      return "Muut rakennukset"

    default:
      return usage
  }
}


export async function update(returnData){
    console.log("Updating database...")
    await axios.get('https://opaskartta.turku.fi/TeklaOGCWeb/WFS.ashx?service=wfs&version=1.1.0&request=GetFeature&TypeName=bldg:Building_LOD0&maxFeatures=9999999')
    .then(async (response) => {
        if(response.status != 200) return; 


        //Poistaa ja luo uudelleen tablen |TODO: Parempi ratkaisu?
        await pool.query("DROP TABLE IF EXISTS building_info;")
        await pool.query("CREATE TABLE building_info(id text, dateadded date, floorcount integer, propertyid bigint, buildingid text, permanentbuildingid text, volume double precision, usage text, apartmentcount integer, floorarea double precision, height double precision, measuredheight double precision, supportingmaterial text, buildingstate text, facadematerial text, address text, location point, yearofconstruction integer, lastgeometrychange date, floorsaboveground integer)");


        let object = parser.parse(response.data);

        //Vastauksen joka talolle
        object["wfs:FeatureCollection"]["gml:featureMember"].forEach(building => {
            const buildingData = building["bldg:Building"];

            const point = parsePoint(buildingData["gen:stringAttribute"]);

            const query = "INSERT INTO building_info(id, dateadded,floorcount,propertyid, buildingid, permanentbuildingid, volume, usage, apartmentcount, floorarea, height, measuredheight, supportingmaterial, buildingstate, facadematerial, address, location, yearofconstruction, lastgeometrychange, floorsaboveground) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)";
            const values = [
                buildingData["@_gml:id"],
                buildingData["gen:dateAttribute"]["gen:value"],
                getValueFromAttributes(buildingData["gen:stringAttribute"], "kerrosluku"),
                //getValueFromAttributes(buildingData["gen:stringAttribute"], "kiinteistotunnus"),
                0,
                getValueFromAttributes(buildingData["gen:stringAttribute"], "vanharakennustunnus"),
                getValueFromAttributes(buildingData["gen:stringAttribute"], "pysyvarakennustunnus"),
                getValueFromAttributes(buildingData["gen:stringAttribute"], "tilavuus"),
                mapUsage(buildingData["bldg:class"] + "-" + buildingData["bldg:usage"] + "-" + buildingData["bldg:function"]),
                getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennuksen huoneistojen lukumaara"),
                getValueFromAttributes(buildingData["gen:stringAttribute"], "kerrosala"),
                getValueFromAttributes(buildingData["gen:stringAttribute"], "korkeus"),
                buildingData["bldg:measuredHeight"]["#text"],
                getValueFromAttributes(buildingData["gen:stringAttribute"], "kantava rakennusaine"),
                getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennuksen tila"),
                getValueFromAttributes(buildingData["gen:stringAttribute"], "rakennuksen julkisivumateriaali"),
                getValueFromAttributes(buildingData["gen:stringAttribute"], "osoite"),
                point,
                buildingData["bldg:yearOfConstruction"],
                buildingData["gen:dateAttribute"]["gen:value"],
                buildingData[ "bldg:storeysAboveGround"]
            ];
            
            pool.query(query, values);
        });
    });
    console.log("Update done")
}



