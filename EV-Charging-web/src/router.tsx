// src/router.jsx
import { Navigate, createHashRouter } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Location from "./pages/Location/Location";
import Dashboard from "./pages/Dashboard/Dashboard";

import DataAnalysis from "./pages/DataAnalysis/DataAnalysis";


export default createHashRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Location /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "data-analysis", element: <DataAnalysis /> },
    ],
  },
  // 兜底
  { path: "*", element: <Navigate to="/" replace /> },
]);
