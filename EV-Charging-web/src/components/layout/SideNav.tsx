// src/components/layout/SideNav.jsx
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PlaceIcon from "@mui/icons-material/Place";
import TimelineIcon from "@mui/icons-material/Timeline";

export default function SideNav({ width }) {
  const { pathname } = useLocation();

  const menu = [
    { text: "Location", icon: <PlaceIcon />, to: "/" },
    { text: "Dashboard", icon: <DashboardIcon />, to: "/Dashboard" },
    { text: "Data Analysis", icon: <TimelineIcon />, to: "/data-analysis" },
  ];
  const isActivePath = (to) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          bgcolor: "primary.main",
          color: "#fff",
        },
      }}
    >
      {/* group name */}
      <Toolbar sx={{ px: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          group name
        </Typography>
      </Toolbar>

      {/* menu */}
      <List sx={{ px: 1 }}>
        {menu.map(({ text, icon, to }) => {
          const isActive = isActivePath(to);
          return (
            <ListItemButton
              key={text}
              component={RouterLink}
              to={to}
              selected={isActive}
              sx={{
                my: 0.5,
                borderRadius: 2,
                // normal state & hover
                "&&:hover": {
                  bgcolor: "primary.dark", // your own hover color
                  color: "rgba(255, 255, 255, 0.8)",
                  outline: "none",
                },
                // active (selected) state
                "&&.Mui-selected": {
                  bgcolor: "secondary.main",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": { color: "primary.main" },
                },
                // active + hover (selected & hover at the same time)
                "&&.Mui-selected:hover": {
                  bgcolor: "secondary.dark", // slightly darker than selected
                },
                // keyboard focus for accessibility
                "&.Mui-focusVisible": {
                  outline: `2px solid #90caf9`,
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{icon}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
