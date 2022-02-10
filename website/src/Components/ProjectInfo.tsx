import { Container, Grid, Link, Typography } from '@mui/material';
import React from 'react'
import githubLogo from "../GitHub-Mark-120px-plus.png"

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
                <Typography align='center'>
                    Rakennusten lähde: 
                    <Link color={"secondary"} href='https://www.turku.fi/turku-tieto/kartat-ja-paikkatieto/karttapalveluiden-rajapinnat' target={"_blank"}>Turun karttapalveluiden rajapinnat</Link>
                </Typography>
                <Typography align='center'>Tämän nettisivun käyttämää aineistoa on muokattu.</Typography>

                <Typography align='center'>
                    <Link color={"secondary"} href='https://www.turku.fi/avoindata/lupa' target={"_blank"}>Turun avoimen datan käyttölupa</Link>
                </Typography>

                
            </Grid>

            <Grid item justifyContent={"center"}>
                <Typography>Lähdekoodi :</Typography>

                <Grid container justifyContent={"center"}>
                    <Link variant='button' href='https://github.com/Akaseli/turunrakennukset' target={"_blank"}>
                        <img height={40} src={githubLogo}></img>
                    </Link>
                </Grid>
            </Grid>
        </Grid>
     );
}