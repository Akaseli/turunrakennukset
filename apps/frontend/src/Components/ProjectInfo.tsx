import { Container, Grid, Link, Typography } from '@mui/material';
import React from 'react';

interface Props {
    
}

export const ProjectInfo: React.FC<Props> = () => {
     return(
        <Grid container 
            alignItems={'center'}
            direction={'column'}
            justifyContent={'center'}
        >
            <Grid item sx={{
                margin: 2
            }}>
                <Typography align='center'>Rakennustiedot © Turun kaupunki, käyttölupa CC BY 4.0</Typography>

                <Typography align='center'>
                    <Link color={"secondary"} href='https://www.turku.fi/tietoa-turusta/kartat-ja-paikkatieto' target={"_blank"}> Turun seudun karttapalvelun rajapinnat </Link> 
                </Typography>        

                <Typography align='center'>Tämän nettisivun käyttämää aineistoa on muokattu.</Typography>     
   
            </Grid>

            <Grid item justifyContent={"center"}>
                <Typography>Lähdekoodi :</Typography>

                <Grid container justifyContent={"center"}>
                    <Link variant='button' href='https://github.com/Akaseli/turunrakennukset' target={"_blank"}>
                        <img height={40} src={"/github_logo.png"}></img>
                    </Link>
                </Grid>
            </Grid>
        </Grid>
     );
}