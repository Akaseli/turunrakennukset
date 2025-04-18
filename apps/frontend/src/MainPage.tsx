import { useEffect, useState } from 'react'
import { Map } from './Components/Map';
import axios from 'axios';
import { Building, Selection } from './interfaces';
import { Navigation } from './Components/Navigation';
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

    useEffect(() => {
        //Käyttötarkoitukset
        axios.get("http://localhost:4000/info")
            .then((response) => {
                if(response.status !== 200) return;

                setUsages(response.data[0].sort());
                setDataUpdated(response.data[1]);
            })

        //Rakennukset
        axios.get("http://localhost:4000/buildings")
            .then((response) => {
                if (response.status !== 200) return;

                setBuildings(response.data);
            });
    }, [])

    //Filtteröi talot
    useEffect(() => {
        if(selection.usage != "Kaikki"){
            setSelectedBuildings(buildings.filter(building =>  building.yearofconstruction != null && building.yearofconstruction != 0 && selection.min <= building.yearofconstruction && building.yearofconstruction <= selection.max && building.usage == selection.usage));
        }
        else{
            setSelectedBuildings(buildings.filter(building => building.yearofconstruction != null && building.yearofconstruction != 0 && selection.min <= building.yearofconstruction && building.yearofconstruction <= selection.max));
        }
    }, [selection]);


    //Laskee talot joita ei välttämättä voida näyttää
    useEffect(() => {
        setBuildingsNoInfo(buildings.filter(building => building.yearofconstruction == null || building.yearofconstruction == 0).length);
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