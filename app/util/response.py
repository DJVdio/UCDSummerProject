from typing import Generic, TypeVar, Optional

from pydantic.generics import GenericModel

T = TypeVar("T")

class StandardResponse(GenericModel, Generic[T]):
    code: int
    message: str
    data: Optional[T] = None

class Response:
    @staticmethod
    def ok(data=None, message: str = "OK"):
        return StandardResponse(code=200, message=message, data=data)

    @staticmethod
    def not_found(message: str = "Not Found"):
        return StandardResponse(code=404, message=message, data=None)

    @staticmethod
    def forbidden(message: str = "Forbidden"):
        return StandardResponse(code=403, message=message, data=None)

    @staticmethod
    def bad_request(message: str = "Bad Request"):
        return StandardResponse(code=400, message=message, data=None)

    @staticmethod
    def server_error(message: str = "Internal Server Error"):
        return StandardResponse(code=500, message=message, data=None)
