import {
  AppBar,
  Toolbar,
  Box,
} from "@mui/material";
import MapControl from "./../../components/mapView/MapControl"

interface TopBarProps {
  drawerWidth: number;
}

export default function TopBar({ drawerWidth }: TopBarProps) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="inherit"
      sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: `${drawerWidth}px` }}
    >
      <Toolbar
        disableGutters
        sx={{
          px: 2,
          minHeight: 64,
          height: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <MapControl />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
