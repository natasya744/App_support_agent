from fastapi import FastAPI

app = FastAPI(title="App Support Agent")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
