import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster';
import './App.css'
import proj4 from 'proj4';
import axios from 'axios'

import menuSvg from "./menu.svg"
import githubLogo from "./GitHub-Mark-Light-120px-plus.png"

interface Props {

}

interface Talo {
    id: number,
    dateAdded: Date,
    kerrostenMäärä?: number,
    kiinteistötunnus?: number,
    pysyväRakennustunnus?: string,
    rakennustunnus?: string,
    tilavuus?: number,
    käyttötarkoitus?: string,
    huoneistojenmäärä?: number,
    kerrosala?: number,
    korkeus?: number,
    mitattuKorkeus?: number,
    kantavaRakennusaine?: string,
    rakennuksenTila?: string,
    julkisivuMateriaali?: string,
    osoite?: string,
    sijainti?: [number, number],
    rakennusvuosi?: number,
    viimeisinGeometriaMuutos?: Date,
    kerroksiaMaanpinnanYläpuolella?: number,
}

interface Rajaus {
    min: number,
    max: number,
    usage: string
}

export const Etusivu: React.FC<Props> = () => {
    proj4.defs("EPSG:3877", "+proj=tmerc +lat_0=0 +lon_0=23 +k=1 +x_0=23500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

    const [talot, päivitäTalot] = useState<Talo[]>([])

    const [rajaus, päivitäRajaus] = useState<Rajaus>({ min: 0, max: 0, usage: "Kaikki" })

    const [käyttötarkoitukset, päivitäKäyttötarkoitus] = useState<string[]>([])

    //Sivuvalikon näkyvyys kapeilla laitteilla
    const [menuShown, changeMenu] = useState(true)

    useEffect(() => {
        //TALOT
        axios.get("talot.json")
            .then((response) => {
                let data: [] = response.data;

                let tempTalot: Talo[] = []

                data.forEach(element => {
                    let elementTalo: Talo = { id: element["id"], dateAdded: element["dateAdded"] };

                    //Kerrostenmäärä
                    if (element["rakennuksen kerrosten maara"]) {
                        elementTalo.kerrostenMäärä = element["rakennuksen kerrosten maara"];
                    }
                    //Kiinteistötunnus
                    if (element["kiinteistotunnus"]) {
                        elementTalo.kiinteistötunnus = element["kiinteistotunnus"];
                    }
                    //Pysyvä rakennustunnus
                    if (element["pysyva rakennustunnus"]) {
                        elementTalo.pysyväRakennustunnus = element["pysyva rakennustunnus"];
                    }
                    //Rakennustunnus
                    if (element["rakennustunnus"]) {
                        elementTalo.rakennustunnus = element["rakennustunnus"];
                    }
                    //Tilavuus
                    if (element["rakennuksen tilavuus"]) {
                        elementTalo.tilavuus = element["rakennuksen tilavuus"];
                    }
                    //Käyttötarkoitus
                    if (element["käyttötarkoitus"]) {
                        elementTalo.käyttötarkoitus = element["käyttötarkoitus"];
                    }
                    //Huoneistojen määrä
                    if (element["rakennuksen huoneistojen lukumaara"]) {
                        elementTalo.huoneistojenmäärä = element["rakennuksen huoneistojen lukumaara"];
                    }
                    //Kerrosala
                    if (element["rakennuksen kokonaisala"]) {
                        elementTalo.kerrosala = element["rakennuksen kokonaisala"];
                    }
                    //Korkeus
                    if (element["rakennuksen korkeus"]) {
                        elementTalo.korkeus = element["rakennuksen korkeus"];
                    }
                    //Mitattu korkeus
                    if (element["measuredHeight"]) {
                        elementTalo.mitattuKorkeus = element["measuredHeight"];
                    }
                    //Kantava Rakennusaine
                    if (element["kantava rakennusaine"]) {
                        elementTalo.kantavaRakennusaine = element["kantava rakennusaine"];
                    }
                    //Rakennuksen tila
                    if (element["rakennuksen tila"]) {
                        elementTalo.rakennuksenTila = element["rakennuksen tila"];
                    }
                    //Julkisivun materiaali
                    if (element["rakennuksen julkisivumateriaali"]) {
                        elementTalo.julkisivuMateriaali = element["rakennuksen julkisivumateriaali"];
                    }
                    //Osoite
                    if (element["osoite"]) {
                        elementTalo.osoite = element["osoite"];
                    }
                    //Sijainti
                    if (element["sijainti"]) {
                        let value: string = element["sijainti"];

                        let parts = value.split(" ")

                        let coords: [number, number] = proj4("EPSG:3877").inverse([parseFloat(parts[1]), parseFloat(parts[0])]);

                        elementTalo.sijainti = [coords[1], coords[0]];
                    }
                    //Rakennusvuosi
                    if (element["yearOfConstruction"]) {
                        elementTalo.rakennusvuosi = element["yearOfConstruction"];
                    }
                    //Geometrian Muutos
                    if (element["lastGeometryChangeDate"]) {
                        elementTalo.viimeisinGeometriaMuutos = element["lastGeometryChangeDate"];
                    }
                    //Kerrokset
                    if (element["storeysAboveGround"]) {
                        elementTalo.kerroksiaMaanpinnanYläpuolella = element["storeysAboveGround"];
                    }

                    tempTalot.push(elementTalo);
                });

                päivitäTalot(tempTalot)
            });


        //Käyttötarkoitukset
        axios.get("types.json")
            .then((response) =>{
                let käyttötarkoitus: [] = response.data;
                let tarkoitukset: string[] = []

                käyttötarkoitus.forEach(element => {
                    tarkoitukset.push(element)
                });

                päivitäKäyttötarkoitus(["Kaikki", ...tarkoitukset]);
            })

        

    }, [])


    let talojaNäkyvissä = 0;
    let talojaIlmanTarvittaviatietoja = 0;

    useEffect(() => {
        talojaNäkyvissä = 0;
        talojaIlmanTarvittaviatietoja = 0;

    }, [rajaus])

    const käyttöTarkoitusLista = käyttötarkoitukset.map((tarkoitus, index) => {
        return (
            <option key={index}>
                {tarkoitus}
            </option>
        );
    })

    const markers = talot.map((talo, index) => {
        if (!talo.sijainti) {
            talojaIlmanTarvittaviatietoja += 1
            return null
        }
        if (!talo.rakennusvuosi) {
            talojaIlmanTarvittaviatietoja += 1
            return null
        }

        if (talo.rakennusvuosi == 0) {
            talojaIlmanTarvittaviatietoja += 1
            return null
        }


        //Käyttötarkoitus
        if (talo.käyttötarkoitus != rajaus.usage && rajaus.usage != "Kaikki") return null


        //Talot Vuoden mukaan
        if (talo.rakennusvuosi >= rajaus.min && talo.rakennusvuosi <= rajaus.max) {
            talojaNäkyvissä += 1;
            return (
                <Marker key={index} position={[talo.sijainti[0], talo.sijainti[1]]}>
                    <Popup>
                        <div className='popup'>
                            <h3>{talo.osoite}</h3>
                            <p>Rakennettu: {talo.rakennusvuosi}</p>
                            <p>Kiinteistötunnus: {talo.kiinteistötunnus}</p>
                            <p>Rakennustunnus: {talo.rakennustunnus}</p>
                            <p>Pysyvä rakennustunnus: {talo.pysyväRakennustunnus}</p>
                            <p>Käyttötarkoitus: {talo.käyttötarkoitus}</p>
                            <p>Kerrosala: {talo.kerrosala}</p>
                            <p>Kerrosluku: {talo.kerrostenMäärä}</p>
                            <p>Asuntoja: {talo.huoneistojenmäärä}</p>

                        </div>
                    </Popup>
                </Marker>
            );
        }
        return null
    })

    let currentRajaus: Rajaus = { min: rajaus.min, max: rajaus.max, usage: rajaus.usage }

    return (
        <div>
            <div className={menuShown ? 'menuControl out' : 'menuControl in'} onClick={() => changeMenu(!menuShown)}>
                <img src={menuSvg}></img>
            </div>
            <div className='content'>
                <div className={menuShown ? "options active" : "options deactive"}>
                    <h2>Turun rakennukset</h2>
                    <p className='note'>Rakennukset päivitetty viimeksi 5.2.2022</p>
                    <p>- {talot.length} rakennuksesta on tietoa.</p>
                    <p>- {talojaIlmanTarvittaviatietoja} rakennusta ei voida näyttää kartalla.</p>
                    <p>- {talojaNäkyvissä} rakennusta löydettiin valinnoilla.</p>


                    <form onSubmit={(e) => {
                        e.preventDefault();
                        console.log(currentRajaus)
                        päivitäRajaus(currentRajaus)
                    }}>
                        <label>
                            Alin valmistumisvuosi:
                            <br />
                            <input type="number" min={0} max={2030} defaultValue={rajaus.min} onChange={(e) => currentRajaus.min = e.target.valueAsNumber} required />
                        </label>
                        <br />
                        <label>
                            Ylin valmistumisvuosi:
                            <br />
                            <input type="number" min={0} max={2030} defaultValue={rajaus.max} onChange={(e) => currentRajaus.max = e.target.valueAsNumber} required />
                        </label>
                        <br />
                        <label>
                            Rakennuksen käyttötarkoitus:
                            <br />
                            <select onChange={(e) => currentRajaus.usage = e.target.value}>
                                {käyttöTarkoitusLista}
                            </select>
                        </label>
                        <br />
                        <button type="submit">Rajaa</button>
                    </form>

                    <div className='bottom'>
                        <p>Rakennusten lähde: <a href='https://www.turku.fi/turku-tieto/kartat-ja-paikkatieto/karttapalveluiden-rajapinnat' target={"_blank"}>Turun karttapalveluiden rajapinnat</a></p>
                        <p>Tämän nettisivun käyttämää aineistoa on muokattu.</p>
                        <p>Turun avoin data käyttölupa: <a href='https://www.turku.fi/avoindata/lupa' target={"_blank"}>https://www.turku.fi/avoindata/lupa</a></p>
                        <div className='github'>
                            <p>Lähdekoodi :</p>
                            <a href='https://github.com/Akaseli/turunrakennukset' target={"_blank"}><img src={githubLogo}></img></a>
                        </div>

                    </div>
                </div>

                <MapContainer center={[60.5, 22]} zoom={10} scrollWheelZoom={true} tap={false} zoomControl={false}>
                    <TileLayer
                        maxZoom={23}
                        maxNativeZoom={19}

                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />


                    <MarkerClusterGroup>
                        {markers}
                    </MarkerClusterGroup>

                    <ZoomControl position='bottomright' />
                </MapContainer>
            </div>
        </div>
    );
}