import { ThemeProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import ReactDOM from 'react-dom';
import { MainPage } from './MainPage';
import theme from './theme'

ReactDOM.render(
  <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainPage/>
  </ThemeProvider>,
  document.getElementById('root')
);
