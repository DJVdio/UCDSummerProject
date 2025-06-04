// src/components/layout/MainLayout.jsx
import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import SideNav from "./SideNav";
import TopBar from "./TopBar";

const drawerWidth = 280;

export default function MainLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Left navigation */}
      <SideNav width={drawerWidth} />

      {/* Right area */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <TopBar drawerWidth={drawerWidth} />
        <Toolbar sx={{height: "90px"}}/>

        <Box component="main" sx={{ overflow: "auto", flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
