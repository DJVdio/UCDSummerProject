from fastapi import FastAPI
from app.middleware.error_handlers import register_error_handlers
from database import engine, Base
from routers import city,charging_stations,station_status
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

register_error_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    city.router,
    prefix="/cities",
    tags=["cities"]
)
app.include_router(
    charging_stations.router,
    prefix="/charging_stations",
    tags=["charging_stations"]
)
app.include_router(
    station_status.router,
    prefix="/station_status",
    tags=["station_status"]
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)