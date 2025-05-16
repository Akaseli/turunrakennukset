import React, { useCallback, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { Building } from "../interfaces";
import "./Map.css";

interface Props {
  buildings: Building[];
}

export const Map: React.FC<Props> = ({ buildings }) => {
  const [activeBuilding, setActiveBuilding] = useState<Building|null>(null)

  const handleMarkerClick = (building: Building) => {
    setActiveBuilding(building);
  };

  const markers = useMemo(() => {
    return buildings.map((building, index) => {
      return (
        <Marker
          key={index}
          position={[building.location.x, building.location.y]}
          eventHandlers={{
            click: () => {
              handleMarkerClick(building);
            },
          }}
        />
      );
    });
  }, [buildings]);

  return (
    <div>
      <MapContainer
        center={[60.45, 22.25]}
        zoom={11}
        scrollWheelZoom={true}
        tap={false}
        zoomControl={false}
      >
        <TileLayer
          maxZoom={23}
          maxNativeZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup>{markers}</MarkerClusterGroup>

        {activeBuilding && (
          <Popup
            position={[activeBuilding.location.x, activeBuilding.location.y]}
            onClose={() => setActiveBuilding(null)}
          >
            <div className="popup">
              <h3>{activeBuilding.address ?? 'Ei tietoa'}</h3>
              <p>Rakennettu: {activeBuilding.yearofconstruction ?? 'Ei tietoa'}</p>
              <p>Kiinteistötunnus: {activeBuilding.propertyid ?? 'Ei tietoa'}</p>
              <p>Rakennustunnus: {activeBuilding.permanentbuildingid ?? 'Ei tietoa'}</p>
              <p>Käyttötarkoitus: {activeBuilding.usage ?? 'Ei tietoa'}</p>
              <p>Ala: {activeBuilding.floorarea ?? 'Ei tietoa'}</p>
              <p>Kerrosluku: {activeBuilding.floorcount ?? 'Ei tietoa'}</p>
              <p>Julkisivu: {activeBuilding.facadematerial ?? 'Ei tietoa'}</p>
              <p>Korkeus: {activeBuilding.measuredheight ?? 'Ei tietoa'}</p>
            </div>
          </Popup>
        )}

        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
};
