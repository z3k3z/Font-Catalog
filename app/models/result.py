from dataclasses import dataclass
from typing import Generic, TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class Result(Generic[T]):
    value: T | None
    error: str | None = None

    def succeeded(self) -> bool:
        did_succeed: bool = self.error is None

        return did_succeed

    def failed(self) -> bool:
        did_fail: bool = self.error is not None

        return did_fail

    def get_value(self) -> T:
        if self.value is None:
            raise RuntimeError("Cannot get value from failed Result.")

        return self.value
