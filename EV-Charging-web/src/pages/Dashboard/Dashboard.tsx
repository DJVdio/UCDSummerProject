import ChartControl from "./../../components/chartControl/ChartControl"
import DashboardView from "./../../components/dashboardView/DashboardView"
import "./Dashboard.css"

export default function DataAnalysis() {
  return (
    <div className="home_page_dash">
      <ChartControl />
      <DashboardView />
    </div>
  );
}
