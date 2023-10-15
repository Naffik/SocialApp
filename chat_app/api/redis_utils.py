import redis

redis_instance = redis.StrictRedis(host='cache', port=6379, db=0)


def add_online_user(user_pk):
    redis_instance.sadd("online_users", user_pk)


def remove_online_user(user_pk):
    redis_instance.srem("online_users", user_pk)


def get_online_users():
    return redis_instance.smembers("online_users")
