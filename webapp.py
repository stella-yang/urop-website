import flask
import json
import waitress
import sqlite3

from utils import *


def run_webapp(DB_LOCATION, PORT, webapp_context):
    webapp = flask.Flask(
        __name__,
        static_url_path="",
        static_folder="static")

    @webapp.route("/")
    def index_bypass():
        return webapp.send_static_file("index.html")

    @webapp.route("/data.json")
    def send_data():
        return flask.Response(
            webapp_context["data_json"],
            mimetype="application/json")

    @webapp.route("/subscription/count.json")
    def get_sub_count():
        db_connection = sqlite3.connect(DB_LOCATION)
        db_cursor = db_connection.cursor()
        response = json.dumps(db_cursor.execute(
            "SELECT COUNT(*) FROM subscribers;"
        ).fetchone()[0])
        db_connection.commit()
        db_connection.close()
        return flask.Response(response, mimetype="application/json")

    @webapp.route("/subscription/check/<email>")
    def check_sub_email(email):
        db_connection = sqlite3.connect(DB_LOCATION)
        db_cursor = db_connection.cursor()
        response = json.dumps(db_cursor.execute(
            "SELECT COUNT(*) FROM subscribers WHERE email = ?;",
            (email,)).fetchone()[0] > 0)
        db_connection.commit()
        db_connection.close()
        return flask.Response(response, mimetype="application/json")

    @webapp.route("/subscription/toggle/<email>")
    def toggle_sub_email(email):
        db_connection = sqlite3.connect(DB_LOCATION)
        db_cursor = db_connection.cursor()
        in_subscribers = db_cursor.execute(
            "SELECT COUNT(*) FROM subscribers WHERE email = ?;",
            (email,)).fetchone()[0] > 0
        db_cursor.execute(
            "DELETE FROM subscribers WHERE email = ?;"
            if in_subscribers else
            "INSERT INTO subscribers VALUES (?);",
            (email,))
        db_connection.commit()
        db_connection.close()
        response = ("Unsubscribed " if in_subscribers else "Subscribed ") \
            + email + "."
        print_with_datetime(response)
        return flask.Response(response, mimetype="text/html")

    waitress.serve(webapp, host="0.0.0.0", port=PORT)
