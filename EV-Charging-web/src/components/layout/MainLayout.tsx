// src/components/layout/MainLayout.jsx
import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import SideNav from "./SideNav";
import TopBar from "./TopBar";

const drawerWidth = 220;

export default function MainLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100vw" }}>
      {/* Left navigation */}
      <SideNav width={drawerWidth} />

      {/* Right area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* <TopBar drawerWidth={drawerWidth} /> */}
        {/* <Toolbar sx={{height: "90px"}}/> */}

        <Box component="main" sx={{ overflow: "visible", flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
