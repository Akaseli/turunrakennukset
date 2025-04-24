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

            <Alert
              severity='warning'
              sx={{
                marginBottom: 1,
              }}
            >
               <Typography sx={{
                  fontSize: 'small',
                  justifySelf: 'baseline'
                }}>Sivuston tietoja on yhdistetty monesta lähteestä, joten tieto saattaa olla paikoin virheellistä tai vanhentunutta.</Typography>

            </Alert>

            <Typography>{amountOfHouses} rakennuksesta löytyy sijaintitiedot.</Typography>
            <Typography>{amountOfHousesWithMissingData} rakennuksesta ei ole tiedossa rakennusvuotta.</Typography>
            <Typography>{housesVisible} rakennusta löydettiin valinnoilla.</Typography>
         </Container>
     );
}