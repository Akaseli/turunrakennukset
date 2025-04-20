import React from 'react'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { Building } from '../interfaces';
import './Map.css'

interface Props {
    buildings: Building[]
}

export const Map: React.FC<Props> = ({buildings}) => {

    const markers = buildings.map((building, index) => {
        return (
            <Marker key={index} position={[building.location.x, building.location.y]}>
                <Popup>
                    <div className='popup'>
                        <h3>{building.address ?? "Ei tietoa"}</h3>
                        <p>Rakennettu: {building.yearofconstruction ?? "Ei tietoa"}</p>
                        <p>Kiinteistötunnus: {building.propertyid ?? "Ei tietoa" }</p>
                        <p>Rakennustunnus: {building.permanentbuildingid ?? "Ei tietoa"}</p>
                        <p>Käyttötarkoitus: {building.usage ?? "Ei tietoa"}</p>
                        <p>Ala: {building.floorarea ?? "Ei tietoa"}</p>
                        <p>Kerrosluku: {building.floorcount ?? "Ei tietoa"}</p>
                        <p>Julkisivu: {building.facadematerial ?? "Ei tietoa"}</p>
                        <p>Korkeus: {building.measuredheight ?? "Ei tietoa"}</p>
                    </div>
                </Popup>
            </Marker>
        );
    });

     return(
         <div>
            <MapContainer center={[60.45, 22.25]} zoom={11} scrollWheelZoom={true} tap={false} zoomControl={false}>
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
     );
}