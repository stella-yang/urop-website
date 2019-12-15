from flask import Flask
import flask
from waitress import serve

app = Flask(__name__, static_url_path="")

@app.route("/")
def index_bypass():
    return flask.send_from_directory("static", "index.html")

@app.route("/<path:path>")
def send_static(path):
    return flask.send_from_directory("static", path)

# app.run()
# app.run(host="0.0.0.0", port=61000)
serve(app, host="0.0.0.0", port=61000)
