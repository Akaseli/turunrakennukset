import { XMLParser } from 'fast-xml-parser';
import pg from 'pg';
import proj4 from 'proj4';
import 'dotenv/config'
import axios from 'axios';
import { SaxesParser } from 'saxes';

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
proj4.defs("EPSG:3877","+proj=tmerc +lat_0=0 +lon_0=23 +k=1 +x_0=23500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

function getValueFromXML(data: Building){
  if(!data) return null;

  if(Object.keys(data.children).includes("value")){
    return data.children["value"].text
  }
  else{
    return data.children["gen:value"]?.children["value"]?.text ?? null
  }  
}

function parsePoint(list: Building){
    const x = parseFloat(getValueFromXML(list.children["x"]));
    const y = parseFloat(getValueFromXML(list.children["y"]));

    if(x && y){ 
      let latlngParts = proj4("EPSG:3877").inverse([y, x])

      return (latlngParts[1] + "," + latlngParts[0]);
    }
    else{
      const string = getValueFromXML(list.children["sijainti"])

      let parts = string.split(" ");

      let latlngParts = proj4("EPSG:3877").inverse([parseFloat(parts[1]), parseFloat(parts[0])]);
      
      return (latlngParts[1] + "," + latlngParts[0]);
    }
}

function parseRawPoint(x: number, y: number){
  let latlngParts = proj4("EPSG:3877").inverse([y, x]);
      
  return (latlngParts[1] + "," + latlngParts[0]);
}

function mapUsage(usage){
  //Class, usage, function
  switch(usage){
    
    case "1000-1000-1000":
      return "Muutaman asunnon talo"

    case "1000-1000-1010":
      return "Rivi-/Kerrostalo"
    
      case "1030-1150-1020":
      return "Toimistorakennus"

    case "1030-1150-1050":
      return "Liiketila"
    
    case "1040-1240-1240":
      return " Ravintolat, ruokalat ja baarit"

    case "1050-1100-1100":
      return "Vapaa-ajan asunnot"

    case "1060-2550-2550":
      return "Urheilu";

    case "1070-2120-2120":
      return "Kulttuuri"

    case "1080-2210-2210":
      return "Uskonnolliset rakennukset"

    case "1090-1070-1070":
      return "Maa- ja metsätalouden rakennukset"
    
    case "1090-1940-1940":
      return "Kasvihuoneet"
    
    case "1100-2070-2070":
      return "Koulu"

    case "1120-1150-1050":
      return "Majoitusrakennukset"

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
      return "Ulkovarasto"
    
    case "1160-1700-1700":
      return "Voimalaitosrakennukset"
      
    case "161-161-161":
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
      return "Muut rakennukset"
  }
}


  interface Building{
    name?: string,
    text?: string,
    children: Record<string, Building>
  }


export async function updateSources(){
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

  let buildingData1 = await axios.get('https://opaskartta.turku.fi/TeklaOGCWeb/WFS.ashx?service=wfs&version=1.1.0&request=GetFeature&TypeName=bldg:Building_LOD0&maxFeatures=99999', {
    responseType: 'stream'
  });

  if(buildingData1.status != 200) return;

  const stream = buildingData1.data;
  const parser = new SaxesParser({xmlns: true});

  let currentElements: Building[] = [];
  let currentBuilding: Building;
  let collecting = false;

  stream.on('data', (data) => {
    parser.write(data)  
  })

  stream.on('end', () => {
    updateSourceTwo()
  })


  parser.on("opentag", (node) => {
    if(node.name == "bldg:Building"){
      collecting = true;
      currentElements = []

      currentBuilding = {name: node.attributes["gml:id"]["value"], children: {}}
      currentElements.push(currentBuilding);
    }

    if(collecting){
      let name = node.name;

      if(node.name == "gen:stringAttribute"){
        name = node.attributes.name.value
      }

      const newElement: Building = {name: name, children: {}}
      currentElements[currentElements.length - 1].children[name] = newElement;
      currentElements.push(newElement);
    }
  })

  parser.on("text", (text) => {
    if(collecting && text.trim()){
      const parentNode = currentElements[currentElements.length -1]
      parentNode.children["value"] = {text: text.trim(), children: {}};
    }
  })

  parser.on("closetag", (node) => {
    if(!collecting) return;

    currentElements.pop();

    if(node.name == "bldg:Building"){
      collecting = false;

      let buildingInfo = currentBuilding.children["bldg:Building"];

      const avaivableData = {
        id: currentBuilding.name.replace("Building_", ""),
        dateadded: getValueFromXML(buildingInfo.children["gen:dateAttribute"]),
        floorcount: getValueFromXML(buildingInfo.children["kerrosluku"]),
        propertyid:  getValueFromXML(buildingInfo.children["kiinteistotunnus"]),
        permanentbuildingid: getValueFromXML(buildingInfo.children["pysyvarakennustunnus"]),
        volume: getValueFromXML(buildingInfo.children["tilavuus"]),
        usage: mapUsage(getValueFromXML(buildingInfo.children["bldg:class"]) + "-" + getValueFromXML(buildingInfo.children["bldg:usage"]) + "-" + getValueFromXML(buildingInfo.children["bldg:function"])),
        floorarea: getValueFromXML(buildingInfo.children["kokonaisala"]),
        measuredheight: getValueFromXML(buildingInfo.children["bldg:measuredHeight"]),
        address: getValueFromXML(buildingInfo.children["taydellinen_osoite_fi"]),
        location: parsePoint(buildingInfo),
        yearofconstruction: getValueFromXML(buildingInfo.children["bldg:yearOfConstruction"]),
        floorsaboveground: getValueFromXML(buildingInfo.children["bldg:storeysAboveGround"])
      }

      if(avaivableData.permanentbuildingid == undefined || avaivableData.permanentbuildingid == null ||  avaivableData.permanentbuildingid == "") return;

      const validEntries = Object.entries(avaivableData).filter(([key, value]) => value !== undefined && value !== null && value !== "")
      const columns = validEntries.map(([key]) => key).join(", ")
      const values = validEntries.map(([key, value]) => value);

      const valueNumbers = validEntries.map((value, index) => `$${index + 1}`).join(", ")

      const update = validEntries.filter(([key]) => key !== "permanentbuildingid").map(([key]) => `${key} = EXCLUDED.${key}`).join(", ")

      const query = `INSERT INTO building_info(${columns}) VALUES(${valueNumbers}) ON CONFLICT (permanentbuildingid) DO UPDATE SET ${update}`;

      pool.query(query, values);
    }
  })
}

export async function updateSourceTwo(){
  let buildingData2 = await axios.get('https://opaskartta.turku.fi/TeklaOGCWeb/WFS.ashx?service=wfs&version=1.1.0&request=GetFeature&TypeName=kanta:Rakennus&maxFeatures=99999', {
    responseType: 'stream'
  });

  if(buildingData2.status != 200) return;

  const stream = buildingData2.data;
  const parser = new SaxesParser({xmlns: true});

  let currentElements: Building[] = [];
  let currentBuilding: Building;
  let collecting = false;

  stream.on('data', (data) => {
    parser.write(data)  
  })

  stream.on('end', () => {
    updateSourceThree()
  })


  parser.on("opentag", (node) => {
    if(node.name == "kanta:Rakennus"){
      collecting = true;
      currentElements = []
      currentBuilding = {name: node.attributes["gml:id"]["value"], children: {}}
      currentElements.push(currentBuilding);
    }

    if(collecting){
      let name = node.name;

      const newElement: Building = {name: name, children: {}}
      currentElements[currentElements.length - 1].children[name] = newElement;
      currentElements.push(newElement);
    }
  })

  parser.on("text", (text) => {
    if(collecting && text.trim()){
      const parentNode = currentElements[currentElements.length -1]
      parentNode.children["value"] = {text: text.trim(), children: {}};
    }
  })

  parser.on("closetag", (node) => {
    if(!collecting) return;

    currentElements.pop();

    if(node.name == "kanta:Rakennus"){
      collecting = false;

      let buildingInfo = currentBuilding.children["kanta:Rakennus"];

      const avaivableData = {
        id: currentBuilding.name.replace("Rakennus.", ""),
        permanentbuildingid: getValueFromXML(buildingInfo.children["kanta:rakennustunnus"]),
        buildingstate: getValueFromXML(buildingInfo.children["kanta:tila"]),
        facadematerial: getValueFromXML(buildingInfo.children["kanta:julkisivumateriaali"]),
        yearofconstruction: getValueFromXML(buildingInfo.children["kanta:kottovuosi"]),
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

      pool.query(query, values);
    }
  })
}



export async function updateSourceThree() {
  let buildingData3 = await axios.get('https://opaskartta.turku.fi/TeklaOGCWeb/WFS.ashx?service=wfs&version=1.1.0&request=GetFeature&TypeName=GIS:Rakennukset&maxFeatures=99999', {
    responseType: 'stream'
  });

  if(buildingData3.status != 200) return;

  const stream = buildingData3.data;
  const parser = new SaxesParser({xmlns: true});

  let currentElements: Building[] = [];
  let currentBuilding: Building;
  let collecting = false;

  stream.on('data', (data) => {
    parser.write(data)  
  })

  stream.on('end', () => {
    console.log("Update done!")
  })


  parser.on("opentag", (node) => {
    if(node.name == "GIS:Rakennukset"){
      collecting = true;
      currentElements = []
      currentBuilding = {name: node.name, children: {}}
      currentElements.push(currentBuilding);
    }

    if(collecting){
      let name = node.name;

      const newElement: Building = {name: name, children: {}}
      currentElements[currentElements.length - 1].children[name] = newElement;
      currentElements.push(newElement);
    }
  })

  parser.on("text", (text) => {
    if(collecting && text.trim()){
      const parentNode = currentElements[currentElements.length -1]
      parentNode.children["value"] = {text: text.trim(), children: {}};
    }
  })

  parser.on("closetag", (node) => {
    if(!collecting) return;

    currentElements.pop();

    if(node.name == "GIS:Rakennukset"){
      collecting = false;

      let buildingInfo = currentBuilding.children["GIS:Rakennukset"];

      const avaivableData = {
        permanentbuildingid: getValueFromXML(buildingInfo.children["GIS:PysyvaRakennusTunnus"]),
        location:  parseRawPoint(parseFloat(getValueFromXML(buildingInfo.children["GIS:X"])), parseFloat(getValueFromXML(buildingInfo.children["GIS:Y"]))),
        yearofconstruction: getValueFromXML(buildingInfo.children["GIS:Valmistunut"]),
        floorcount: getValueFromXML(buildingInfo.children["GIS:Kerrosluku"]),
        volume: getValueFromXML(buildingInfo.children["GIS:Tilavuus"]),
        floorarea: getValueFromXML(buildingInfo.children["GIS:Kokonaisala"]),
        address: (getValueFromXML(buildingInfo.children["GIS:Osoitenimi_fi"]) ?? "") + " " +  (getValueFromXML(buildingInfo.children["GIS:Osoitenumero"]) ?? "") + ", " +  (getValueFromXML(buildingInfo.children["GIS:Postinumero"]) ?? "") + " " +  (getValueFromXML(buildingInfo.children["GIS:Postitoimipaikka"]) ?? ""),
        floorsaboveground: getValueFromXML(buildingInfo.children["GIS:Kerrosluku"]),
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

      const valueNumbers = validEntries.map((value, index) => `$${index + 1}`).join(", ")

      const update = validEntries.filter(([key]) => key !== "permanentbuildingid").map(([key]) => `${key} = EXCLUDED.${key}`).join(", ")

      let query = `INSERT INTO building_info(${columns}) VALUES(${valueNumbers}) ON CONFLICT (permanentbuildingid) DO`;

      if(values.length > 1){
        query += ` UPDATE SET ${update}`
      }
      else{
        query += " NOTHING"
      }

      pool.query(query, values)
    }
  })
}