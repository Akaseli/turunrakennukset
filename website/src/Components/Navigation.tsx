import { AppBar, Box, Container, Divider, IconButton, SwipeableDrawer, Toolbar, Typography } from '@mui/material';
import React, { useState } from 'react'
import { Menu, ChevronLeft } from '@mui/icons-material';
import { Filter } from './Filter';
import { Info } from './Info';
import { ProjectInfo } from './ProjectInfo';
import { Selection } from '../interfaces';


interface Props {
    amountOfHouses: number,
    missingBuildings: number,
    housesVisible: number,
    dataUpdated: number,

    usageOptions: string[],
    value: Selection,
    onSubmit(arg0: Selection): void
}

export const Navigation: React.FC<Props> = ({amountOfHouses, missingBuildings, housesVisible, dataUpdated, usageOptions, value, onSubmit}) => {
    //Sivuvalikko
    const [menuShown, changeMenu] = useState(true);

    return (
        <Box>
            <AppBar position='static'>
                <Toolbar>
                    <IconButton color='inherit' onClick={() => changeMenu(!menuShown)}>
                        <Menu />
                    </IconButton>

                    <Typography variant='h6'>
                        Turun Rakennukset
                    </Typography>
                </Toolbar>
            </AppBar>
            <SwipeableDrawer
                anchor='left'
                open={menuShown}
                color='primary'

                onOpen={() => changeMenu(!menuShown)}
                onClose={() => changeMenu(!menuShown)}
            >
                <Container
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'end',
                    }}

                >
                    <IconButton
                        color='inherit'
                        onClick={() => changeMenu(!menuShown)}
                    >
                        <ChevronLeft />
                    </IconButton>
                </Container>

                <Divider />

                <Info amountOfHouses={amountOfHouses} amountOfHousesWithMissingData={missingBuildings} housesLastUpdated={new Date(dataUpdated)} housesVisible={housesVisible} />

                <Divider />

                <Filter onSubmit={onSubmit} value={value} usageOptions={["Kaikki", ...usageOptions]}>

                </Filter>

                <Divider />

                <ProjectInfo />
            </SwipeableDrawer>
        </Box>
    );
}