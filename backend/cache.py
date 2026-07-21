import time
import threading
from collections import OrderedDict
from typing import Any, Optional


class CacheEntry:
    def __init__(self, value: Any, timestamp: float):
        self.value = value
        self.timestamp = timestamp


class TTLCache:
    """
    Thread-safe in-memory LRU/TTL cache.
    Evicts expired items on read/write, and evicts least recently used items when max_size is reached.
    """
    def __init__(self, ttl_seconds: float = 60.0, max_size: int = 128):
        self.ttl_seconds = ttl_seconds
        self.max_size = max_size
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None
            entry = self._cache[key]
            if time.monotonic() - entry.timestamp > self.ttl_seconds:
                del self._cache[key]
                return None
            # Move to end as most recently used
            self._cache.move_to_end(key)
            return entry.value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = CacheEntry(value, time.monotonic())
            # Evict if over capacity
            while len(self._cache) > self.max_size:
                self._cache.popitem(last=False)

    def invalidate(self, key: str) -> None:
        with self._lock:
            if key in self._cache:
                del self._cache[key]

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
