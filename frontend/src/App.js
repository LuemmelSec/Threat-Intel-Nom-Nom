import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Components
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Feeds from './pages/Feeds';
import Keywords from './pages/Keywords';
import Alerts from './pages/Alerts';
import Notifications from './pages/Notifications';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import APITemplates from './pages/APITemplates';
import Tags from './pages/Tags';

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#bb86fc',
    },
    secondary: {
      main: '#03dac6',
    },
    error: {
      main: '#cf6679',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/feeds" element={<Feeds />} />
              <Route path="/keywords" element={<Keywords />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/api-templates" element={<APITemplates />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
