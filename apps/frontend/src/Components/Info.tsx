import { Alert, Container, Typography } from '@mui/material'
import React from 'react'

interface Props {
    amountOfHouses: number,
    amountOfHousesWithMissingData: number,
    housesVisible: number,
    housesLastUpdated: Date
}

export const Info: React.FC<Props> = ({amountOfHouses, amountOfHousesWithMissingData, housesVisible, housesLastUpdated}) => {
     return(
         <Container sx={{
             padding: 2,
             maxWidth: "450px"
         }}>
            <Alert 
                severity='info'
                sx={{
                    marginBottom: 1,
                }}
            >
                <Typography sx={{
                  fontSize: 'small',
                  justifySelf: 'baseline'
                }}>{"Talot päivitetty viimeksi: " + housesLastUpdated.toLocaleString()}</Typography>
            </Alert>

            <Typography>{amountOfHouses} rakennuksesta löytyy sijaintitiedot.</Typography>
            <Typography>{amountOfHousesWithMissingData} rakennusta piillotettu kartalta vähäisen tiedon vuoksi.</Typography>
            <Typography>{housesVisible} rakennusta löydettiin valinnoilla.</Typography>
         </Container>
     );
}