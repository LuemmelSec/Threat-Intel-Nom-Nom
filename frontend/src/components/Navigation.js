import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import LabelIcon from '@mui/icons-material/Label';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningIcon from '@mui/icons-material/Warning';
import ShieldIcon from '@mui/icons-material/Shield';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ApiIcon from '@mui/icons-material/Api';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Feeds', icon: <RssFeedIcon />, path: '/feeds' },
  { text: 'Keywords', icon: <LabelIcon />, path: '/keywords' },
  { text: 'Tags', icon: <LocalOfferIcon />, path: '/tags' },
  { text: 'Alerts', icon: <WarningIcon />, path: '/alerts' },
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { text: 'API Templates', icon: <ApiIcon />, path: '/api-templates' },
  { text: 'Logs', icon: <AssessmentIcon />, path: '/logs' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

function Navigation() {
  const location = useLocation();

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <ShieldIcon sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div">
            Threat Intel Nom Nom
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Navigation;
