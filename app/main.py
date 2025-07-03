from fastapi import FastAPI
from middleware.error_handlers import register_error_handlers
from database import engine, Base
from routers import city,charging_stations,station_status,maps,graph
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

ROUTERS = [
    (city.router,           "/cities",           ["cities"]),
    (charging_stations.router, "/charging_stations", ["charging_stations"]),
    (station_status.router,   "/station_status",   ["station_status"]),
    (graph.router, "/graph", ["graph"]),
    (maps.router,   "/map",   ["map"]),
]
for router, prefix, tags in ROUTERS:
    app.include_router(router, prefix=prefix, tags=tags)

register_error_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)