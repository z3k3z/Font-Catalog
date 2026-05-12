from fastapi import FastAPI

app = FastAPI(title="Font Catalog")


@app.get("/")
def read_root() -> dict[str, str]:
    return {"status": "Font Catalog is running"}