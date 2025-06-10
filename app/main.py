from fastapi import FastAPI
from database import engine, Base
from routers import city

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(
    city.router,
    prefix="/cities",
    tags=["cities"]
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)