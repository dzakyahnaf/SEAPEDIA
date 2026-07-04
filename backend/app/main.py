from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, catalog, reviews


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="SEAPEDIA API",
    description=(
        "Backend API untuk SEAPEDIA — marketplace multi-role (Admin, Seller, "
        "Buyer, Driver). Dokumentasi interaktif tersedia di /docs (Swagger UI) "
        "dan /redoc. Endpoint privat memerlukan header "
        "`Authorization: Bearer <token>` dan otorisasi mengikuti role aktif sesi."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")


@app.get("/", tags=["Root"])
def root():
    return {"app": "SEAPEDIA API", "status": "ok", "docs": "/docs"}
