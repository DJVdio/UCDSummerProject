import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.schemas.response import Response

logger = logging.getLogger(__name__)

def register_error_handlers(app):
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        code = exc.status_code
        if code == 404:
            return JSONResponse(
                status_code=200,
                content=Response.not_found().dict()
            )
        elif code == 403:
            return JSONResponse(
                status_code=200,
                content=Response.forbidden().dict()
            )
        elif code == 400:
            return JSONResponse(
                status_code=200,
                content=Response.bad_request().dict()
            )
        else:
            return JSONResponse(
                status_code=200,
                content=Response.server_error(f"HTTP error {code}").dict()
            )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=200,
            content=Response.bad_request("Request validation failed").dict()
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"[Unhandled Exception] {request.url} - {exc}")
        return JSONResponse(
            status_code=200,
            content=Response.server_error("Internal Server Error").dict()
        )
