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
         }}>
            <Alert 
                severity='info'
                sx={{
                    marginBottom: 1
                }}
            >
                {"Talot päivitetty viimeksi:" + housesLastUpdated.toLocaleString()}
            </Alert>
            <Typography>{amountOfHouses} rakennuksesta on tietoa.</Typography>
            <Typography>{amountOfHousesWithMissingData} rakennusta ei voida näyttää kartalla.</Typography>
            <Typography>{housesVisible} rakennusta löydettiin valinnoilla.</Typography>
         </Container>
     );
}