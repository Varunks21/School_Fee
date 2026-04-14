from fastapi import FastAPI

app = FastAPI(title="School Fee System")


@app.get("/")
def root():
    return {"message": "Backend scaffold ready"}
