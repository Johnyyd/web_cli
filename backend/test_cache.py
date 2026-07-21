import time
import pytest
from cache import TTLCache


def test_ttl_cache_basic_get_set():
    cache = TTLCache(ttl_seconds=1.0, max_size=3)
    cache.set("key1", "value1")
    assert cache.get("key1") == "value1"
    assert cache.get("non_existent") is None


def test_ttl_cache_expiration():
    cache = TTLCache(ttl_seconds=0.1, max_size=3)
    cache.set("key1", "value1")
    assert cache.get("key1") == "value1"
    time.sleep(0.15)
    assert cache.get("key1") is None


def test_ttl_cache_lru_eviction():
    cache = TTLCache(ttl_seconds=10.0, max_size=2)
    cache.set("a", 1)
    cache.set("b", 2)
    # Access "a" so "b" becomes the least recently used
    assert cache.get("a") == 1
    # Adding "c" should evict "b"
    cache.set("c", 3)
    assert cache.get("a") == 1
    assert cache.get("c") == 3
    assert cache.get("b") is None


def test_ttl_cache_invalidate_and_clear():
    cache = TTLCache(ttl_seconds=10.0, max_size=5)
    cache.set("x", 10)
    cache.set("y", 20)
    cache.invalidate("x")
    assert cache.get("x") is None
    assert cache.get("y") == 20
    cache.clear()
    assert cache.get("y") is None
