import { XMLParser } from 'fast-xml-parser';
import pg from 'pg';
import proj4 from 'proj4';
import 'dotenv/config'
import axios from 'axios';

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

function parseRawPoint(x: number, y: number){
  proj4.defs("EPSG:3877","+proj=tmerc +lat_0=0 +lon_0=23 +k=1 +x_0=23500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

  let latlngParts = proj4("EPSG:3877").inverse([y, x]);
      
  return (latlngParts[1] + "," + latlngParts[0]);
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
  //Luodaan tarvittaessa
  await pool.query(`CREATE TABLE IF NOT EXISTS building_info(
    permanentbuildingid text PRIMARY KEY, 
    id text, 
    dateadded date, 
    floorcount integer, 
    propertyid bigint, 
    volume double precision, 
    usage text, 
    floorarea double precision, 
    measuredheight double precision, 
    buildingstate text, 
    facadematerial text, 
    address text, 
    location point, 
    yearofconstruction integer, 
    lastgeometrychange date, 
    floorsaboveground integer)`
  );


  console.log("Getting source 1")

  const buildingData1 = await axios.get('https://opaskartta.turku.fi/TeklaOGCWeb/WFS.ashx?service=wfs&version=1.1.0&request=GetFeature&TypeName=bldg:Building_LOD0&maxFeatures=9999999');

  if(buildingData1.status != 200) return;

  let parsedBuildingData1 = parser.parse(buildingData1.data);

  parsedBuildingData1["wfs:FeatureCollection"]["gml:featureMember"].forEach(building => {
    const buildingData = building["bldg:Building"];

    const avaivableData = {
      id: (buildingData["@_gml:id"] as string).replace("Building_", ""),
      dateadded: buildingData["gen:dateAttribute"]["gen:value"],
      floorcount: getValueFromAttributes(buildingData["gen:stringAttribute"], "kerrosluku"),
      propertyid: getValueFromAttributes(buildingData["gen:stringAttribute"], "kiinteistotunnus"),
      permanentbuildingid: getValueFromAttributes(buildingData["gen:stringAttribute"], "pysyvarakennustunnus"),
      volume: getValueFromAttributes(buildingData["gen:stringAttribute"], "tilavuus"),
      usage: mapUsage(buildingData["bldg:class"] + "-" + buildingData["bldg:usage"] + "-" + buildingData["bldg:function"]),
      floorarea: getValueFromAttributes(buildingData["gen:stringAttribute"], "kokonaisala"),
      measuredheight: buildingData["bldg:measuredHeight"]["#text"],
      address: getValueFromAttributes(buildingData["gen:stringAttribute"], "taydellinen_osoite_fi"),
      location: parsePoint(buildingData["gen:stringAttribute"]),
      yearofconstruction: buildingData["bldg:yearOfConstruction"],
      lastgeometrychange: buildingData["gen:dateAttribute"]["gen:value"],
      floorsaboveground: buildingData[ "bldg:storeysAboveGround"]
    }

    if(avaivableData.permanentbuildingid == undefined || avaivableData.permanentbuildingid == null ||  avaivableData.permanentbuildingid == "") return;

    const validEntries = Object.entries(avaivableData).filter(([key, value]) => value !== undefined && value !== null && value !== "")
    const columns = validEntries.map(([key]) => key).join(", ")
    const values = validEntries.map(([key, value]) => value);

    const valueNumbers = validEntries.map((value, index) => `$${index + 1}`).join(", ")

    const update = validEntries.filter(([key]) => key !== "permanentbuildingid").map(([key]) => `${key} = EXCLUDED.${key}`).join(", ")

    const query = `INSERT INTO building_info(${columns}) VALUES(${valueNumbers}) ON CONFLICT (permanentbuildingid) DO UPDATE SET ${update}`;

    pool.query(query, values);
  });

  console.log("Source 1 update done")



  console.log("Getting source 2")
  const buildingData2 = await axios.get('https://opaskartta.turku.fi/TeklaOGCWeb/WFS.ashx?service=wfs&version=1.1.0&request=GetFeature&TypeName=kanta:Rakennus&maxFeatures=9999999');

  if(buildingData2.status != 200) return;

  let parsedBuildingData2 = parser.parse(buildingData2.data);

  parsedBuildingData2["wfs:FeatureCollection"]["gml:featureMember"].forEach(building => {
    const buildingData2 = building["kanta:Rakennus"];

    const avaivableData = {
      id: (buildingData2["@_gml:id"] as string).replace("Rakennus.", ""),
      permanentbuildingid: buildingData2["kanta:rakennustunnus"],
      buildingstate: buildingData2["kanta:tila"],
      facadematerial: buildingData2["kanta:julkisivumateriaali"],
      yearofconstruction: buildingData2["kanta:kottovuosi"]
    }

    if(avaivableData.permanentbuildingid == undefined || avaivableData.permanentbuildingid == null ||  avaivableData.permanentbuildingid == "") return;

    if(avaivableData.yearofconstruction){
      if(typeof(avaivableData.yearofconstruction) == "string"){
        avaivableData.yearofconstruction = (avaivableData.yearofconstruction as string).split("-")[0]
      }
    }

    const validEntries = Object.entries(avaivableData).filter(([key, value]) => value !== undefined && value !== null && value !== "")
    const columns = validEntries.map(([key]) => key).join(", ")
    const values = validEntries.map(([key, value]) => value);

    const valueNumbers = validEntries.map((value, index) => `$${index + 1}`).join(", ")

    const update = validEntries.filter(([key]) => key !== "permanentbuildingid").map(([key]) => `${key} = EXCLUDED.${key}`).join(", ")

    let query = `INSERT INTO building_info(${columns}) VALUES(${valueNumbers}) ON CONFLICT (permanentbuildingid) DO`;

    if(values.length > 1){
      query += ` UPDATE SET ${update}`
    }
    else{
      query += " NOTHING"
    }
    try{
      pool.query(query, values);
    }
    catch (err){
      console.log(avaivableData)
      throw(err)
    }

  });


  console.log("Source 2 update done")

  console.log("Getting source 3")

  const buildingData3 = await axios.get('https://opaskartta.turku.fi/TeklaOGCWeb/WFS.ashx?service=wfs&version=1.1.0&request=GetFeature&TypeName=GIS:Rakennukset&maxFeatures=9999999');

  if(buildingData3.status != 200) return;

  let parsedBuildingData3 = parser.parse(buildingData3.data);

  parsedBuildingData3["wfs:FeatureCollection"]["gml:featureMember"].forEach(building => {
    const buildingData3 = building["GIS:Rakennukset"];

    const avaivableData = {
      permanentbuildingid: buildingData3["GIS:PysyvaRakennusTunnus"],
      location: parseRawPoint(parseFloat(buildingData3["GIS:X"]), parseFloat(buildingData3["GIS:Y"])),
      yearofconstruction: buildingData3["GIS:Valmistunut"],
      floorcount: buildingData3["GIS:Kerrosluku"],
      volume: buildingData3["GIS:Tilavuus"],
      floorarea: buildingData3["GIS:Kokonaisala"],
      address: buildingData3["GIS:Osoitenimi_fi"] + " " + buildingData3["GIS:Osoitenumero"] + ", " + buildingData3["GIS:Postinumero"] + " " + buildingData3["GIS:Postitoimipaikka"],
      floorsaboveground: buildingData3["GIS:Kerrosluku"]
    }
    //Required to link to other sources 
    if(avaivableData.permanentbuildingid == undefined || avaivableData.permanentbuildingid == null ||  avaivableData.permanentbuildingid == "") return;

    if(avaivableData.yearofconstruction){
      if(typeof(avaivableData.yearofconstruction) == "string"){
        avaivableData.yearofconstruction = (avaivableData.yearofconstruction as string).split(".")[2]
      }
    }

    const validEntries = Object.entries(avaivableData).filter(([key, value]) => value !== undefined && value !== null && value !== "")
    const columns = validEntries.map(([key]) => key).join(", ")
    const values = validEntries.map(([key, value]) => value);

    const update = validEntries.map(([key], index) => `${key} = $${index +1}`).join(", ")

    let query = `UPDATE building_info SET ${update} WHERE permanentbuildingid = $${validEntries.length + 1}`;
    values.push(avaivableData.permanentbuildingid)

    pool.query(query, values);
  });

  console.log("Source 3 update done")
}



