export interface Selection {
    min: number,
    max: number,
    usage: string
}

export interface Building {
    id: number,
    dateadded: Date,
    floorcount: number,
    propertyid: number,
    permanentbuildingid: string,
    buildingid: string,
    volume: number,
    usage: string,
    apartmentcount: number,
    floorarea: number,
    height: number,
    measuredheight: number,
    supportingmaterial: string,
    buildingstate: string,
    facadematerial: string,
    address: string,
    location: {x: number, y: number},
    yearofconstruction: number,
    lastgeometrychange: Date,
    floorsaboveground: number,
}