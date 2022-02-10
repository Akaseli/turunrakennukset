import { Button, Container, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react'

import { Selection } from '../interfaces'

interface Props {
    value: Selection,
    usageOptions: string[],
    onSubmit(arg0: Selection): void
}

export const Filter: React.FC<Props> = ({ value, usageOptions, onSubmit }) => {
    const [selection, setSelection] = useState<Selection>({ min: value.min, max: value.max, usage: value.usage });

    const [textErrors, setErrors] = useState({ minText: false, maxText: false });



    const options = usageOptions.map((option, index) => {
        return (
            <MenuItem key={index} value={option}>{option}</MenuItem>
        );
    });

    useEffect(() => {
        //MIN TEXT
        if (isNaN(selection.min)) {
            setErrors(prev => ({
                ...prev,
                minText: true
            }));
        }
        else {
            setErrors(prev => ({
                ...prev,
                minText: false
            }));
        }

        //MAX TEXT
        if (isNaN(selection.max)) {
            setErrors(prev => ({
                ...prev,
                maxText: true
            }));
        }
        else {
            setErrors(prev => ({
                ...prev,
                maxText: false
            }));
        }
    }, [selection])

    //TODO KORJAA INPUTIT
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(selection);
            }}
        >
            <Container 
                sx={{
                    marginTop: 2,
                    marginBottom: 2
                }}
            >
                <InputLabel>
                    Alin valmistumisvuosi:
                    <br />
                    <TextField error={textErrors.minText} type="number" defaultValue={value.min} required onChange={(e) => {
                        setSelection(prev => ({
                            ...prev,
                            min: parseInt(e.target.value)
                        }));
                    }} />
                </InputLabel>
                <InputLabel>
                    Ylin valmistumisvuosi:
                    <br />
                    <TextField error={textErrors.maxText} type="number" defaultValue={value.max} required onChange={(e) => {
                        setSelection(prev => ({
                            ...prev,
                            max: parseInt(e.target.value)
                        }));
                    }} />
                </InputLabel>
                <InputLabel>
                    Rakennuksen käyttötarkoitus:
                    <br />
                    <Select key={`select-${value.usage}`} defaultValue={value.usage} onChange={(e) => {
                        setSelection(prev => ({
                            ...prev,
                            usage: e.target.value
                        }));
                    }}>
                        {options}
                    </Select>
                </InputLabel>
                <br />
                <Button type="submit" variant='contained'>Rajaa</Button>
            </Container>
        </form>
    );
}