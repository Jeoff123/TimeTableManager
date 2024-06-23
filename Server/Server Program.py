from flask import (
    Flask,
    render_template as Serve
)
from flask_caching import Cache

application: Flask = Flask(__name__)
application.template_folder = "../Client/Pages/"
application.static_folder = "../Client/Static/"
cache: Cache = Cache(application, config={
    "CACHE_TYPE": "simple",
    "CACHE_DEFAULT_TIMEOUT": 300
})

@application.route("/", methods = ['GET'])
@cache.cached(timeout=None)
def serveIndexPage():
    return Serve("Index.html")

@application.route("/teachers", methods = ["GET"])
@cache.cached(timeout=300)
def serveTeachersPage():
    return Serve("ManageTeachers.html")