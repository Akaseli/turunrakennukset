import { useEffect, useMemo, useRef, useState } from 'react'
import { Map } from './components/Map';
import axios from 'axios';
import { Building, Selection } from './interfaces';
import { Navigation } from './components/Navigation';
import { Box } from '@mui/material';

export const MainPage = () => {
    const [buildings, setBuildings] = useState<Building[]>([]);

    const [selectedBuildings, setSelectedBuildings] = useState<Building[]>([]);

    const [selection, setSelection] = useState<Selection>({ min: 0, max: 0, usage: "Kaikki" });

    const [usages, setUsages] = useState<string[]>([]);

    const [buildingsNoInfo, setBuildingsNoInfo] = useState(0)

    const [dataUpdated, setDataUpdated] = useState(0)

    const changeSelection = (newSelection:Selection) => {
        setSelection(newSelection);
    }

    const workerRef = useRef<Worker|null>(null)

    useEffect(() => {
        //Käyttötarkoitukset
        axios.get("/api/info")
            .then((response) => {
                if(response.status !== 200) return;

                setUsages(response.data[0].sort());
                setDataUpdated(response.data[1]);
            })

        //Rakennukset
        axios.get("/api/buildings")
            .then((response) => {
                if (response.status !== 200) return;

                setBuildings(response.data);
            });
    }, [])

    useEffect(() => {
      if(!workerRef.current){
        workerRef.current = new Worker(new URL("./filterWorker.ts", import.meta.url), {type: "module"})
      }

      const worker = workerRef.current;

      worker.postMessage({buildings, selection})

      worker.onmessage = (e) => {
        console.log("Filter done")
        setSelectedBuildings(e.data)
      }

      return () => {
        worker.terminate();
        workerRef.current = null
      }
    }, [buildings, selection]);


    //Laskee talot joita ei välttämättä voida näyttää
    useEffect(() => {
        setBuildingsNoInfo(buildings.filter(building => building.yearofconstruction == null).length);
    }, [buildings]);

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Navigation amountOfHouses={buildings.length} housesVisible={selectedBuildings.length} missingBuildings={buildingsNoInfo} dataUpdated={dataUpdated} onSubmit={changeSelection} usageOptions={usages} value={selection}/>
            <Box 
                sx={{
                    width: 1, 
                    position: 'fixed',
                    top: 0,
                    zIndex: -10
                }}
            >
                <Map buildings={selectedBuildings}></Map>
            </Box>
        </Box>
    );
}