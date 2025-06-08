import uvicorn
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/items")
def read_items(db: Session = Depends(get_db)):
    # 这里可以使用 db 执行数据库操作
    # 例如：items = db.query(Item).all()
    return {"message": "Database connection successful"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)