import IrelandCityMap from "./../../components/IrelandCityMapView/IrelandCityMapView"
import WholeCountryView from "./../../components/wholeCountryView/WholeCountryView"

export default function DataAnalysis() {
  return (
    <div className="home_page_analysis">
      {/* 不受时间影响的图表 */}
      <IrelandCityMap />
      <WholeCountryView />
    </div>
  );
}
