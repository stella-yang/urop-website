import sys
import getopt
import getpass
import sqlite3

from utils import *
from scrape import *
from webapp import *
from updater import *


def main(argv):
    """
    Default behavior when run from command line.
    Runs the urop-website server.

    argv: List of command line arguments (sys.argv[1:])
    """
    # Parse command line arguments.
    opts, args = getopt.getopt(
        argv, "", ["port=", "period=", "username=", "password="])
    opts = {opt[0]: opt[1] for opt in opts}

    # Default values.
    SMTP_USERNAME = opts["--username"] if "--username" in opts.keys() else \
        input("MIT SMTP username (Kerberos): ")
    SMTP_PASSWORD = opts["--password"] if "--password" in opts.keys() else \
        getpass.getpass("MIT SMTP password: ")
    PORT = int(opts["--port"]) if "--port" in opts.keys() else 80
    SCRAPE_PERIOD = int(
        opts["--period"]) if "--period" in opts.keys() else 3600

    # Prepare database.
    DB_LOCATION = ".db"
    db_connection = sqlite3.connect(DB_LOCATION)
    db_cursor = db_connection.cursor()
    db_cursor.execute("""CREATE TABLE IF NOT EXISTS urops (
        url TEXT PRIMARY KEY UNIQUE,
        title TEXT,
        description TEXT,
        prereqs TEXT,
        term INTEGER,
        department TEXT,
        faulty_supervisor TEXT,
        faculty_email TEXT,
        apply_by TEXT,
        contact TEXT,
        posted TIMESTAMP,
        last_seen TIMESTAMP
    );""")
    db_cursor.execute("""CREATE TABLE IF NOT EXISTS subscribers (
        email TEXT PRIMARY KEY
    );""")
    db_connection.commit()
    db_connection.close()

    # Setup webserver.
    webapp_context = {
        "running": True,
        "data_json": "",
    }

    start_updater(DB_LOCATION, SCRAPE_PERIOD, SMTP_USERNAME,
                  SMTP_PASSWORD, webapp_context)
    run_webapp(DB_LOCATION, PORT, webapp_context)
    webapp_context["running"] = False


if __name__ == "__main__":
    main(sys.argv[1:])
