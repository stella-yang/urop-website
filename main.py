import flask
import json
import waitress
import threading
import time
import datetime
import traceback
import smtplib
import requests
import bs4
import re
import datetime
import sys
import getopt
import getpass
import sqlite3
import asyncio
import mimetypes
from dateutil import parser
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

TERMS = ["fall", "iap", "spring", "summer"]
TIME_FORMAT = "%m/%d/%y"


def parse_datetime(s):
    """
    Convert a time string into a central format.
    """
    try:
        return parser.parse(s).strftime(TIME_FORMAT)
    except:
        return ""


def unparse_datetime(s):
    """
    Parse central format into datetime object.
    """
    return datetime.datetime.strptime(s, TIME_FORMAT)


def print_with_datetime(s):
    print("[" + str(datetime.datetime.now()) + "]", s)


def scrape(db_cursor):
    """
    Updates the database by scraping the UROP postings board.
    """
    JOBS_BOARD_URL = "https://urop.mit.edu/jobs-board"

    # Get UROP URLs.
    board_soup = bs4.BeautifulSoup(
        requests.get(JOBS_BOARD_URL).text,
        "html.parser"
    )
    urop_doms = board_soup.select("div.site-search-contact")
    urop_urls = [
        "https://urop.mit.edu" +
        urop_dom.select("div.site-search-button>a")[0]["href"]
        for urop_dom in urop_doms
    ]

    # Fetch all UROP URLs.
    async def get_urop_responses(urop_urls):
        """
        Concurrently fetch all UROP URLs.
        """
        loop = asyncio.get_event_loop()
        futures = {
            urop_url: loop.run_in_executor(None, requests.get, urop_url)
            for urop_url in urop_urls
        }
        return {
            urop_url: await future
            for urop_url, future in futures.items()
        }

    loop = asyncio.get_event_loop()
    urop_responses = loop.run_until_complete(get_urop_responses(urop_urls))

    # Get soups for UROPs.
    info_soups = {
        urop_url: bs4.BeautifulSoup(urop_response.text, "html.parser")
        .select("div.page-intro")[0]
        for urop_url, urop_response in urop_responses.items()
    }

    EMAIL_REGEX = "((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))"

    def process_urop_block_text(s):
        """
        Replace \r\n and \n with <br>. Highlight hyperlinks and emails. Bold hours and money.
        """
        LINK_REGEX = "((http|ftp|https)://([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?)"
        tmp = s.replace("\r\n", "<br>").replace("\n", "<br>")
        tmp = re.sub(LINK_REGEX, "<a href=\"\g<1>\">\g<1></a>", tmp)
        tmp = re.sub(EMAIL_REGEX, "<a href=\"mailto: \g<1>\">\g<1></a>", tmp)
        tmp = re.sub("(\d+ (hr|hour)s?)", "<b>\g<1></b>", tmp)
        return re.sub("$\d+(\.\d+)?", "<b>\g<1></b>", tmp)

    # Some preliminary parsing.
    urop_tdp_fields = {
        urop_url: {
            "title": str(info_soup.select("h2")[0].decode_contents())
            .strip(),
            "description": process_urop_block_text(
                info_soup.select("div.row+h3+p")[0]
                .decode_contents().strip()
            ),
            "prereqs": process_urop_block_text(
                info_soup.select("div.row+h3+p+h3+p")[0]
                .decode_contents().strip()
            ),
        }
        for urop_url, info_soup in info_soups.items()
    }

    # Parse other well-formed fields.
    urop_field_soups = {
        urop_url: info_soup.select("div.urop-content")
        for urop_url, info_soup in info_soups.items()
    }
    urop_default_fields = {
        urop_url: {
            field_soup.select("h3")[0]
            .decode_contents().strip().lower()
            .replace(" ", "_").replace(":", ""):
                field_soup.select("p")[0].decode_contents().strip()
            for field_soup in field_soups
        }
        for urop_url, field_soups in urop_field_soups.items()
    }

    # Correct some fields in the default field parsing.
    def parse_contact(s):
        """
        Catches exceptions in parsing the contact field.
        """
        try:
            return re.findall(EMAIL_REGEX, s)[0]
        except:
            return ""

    urop_corrected_fields = {
        urop_url: {
            "term": [
                term.lower()
                for term in default_fields["term"].split("/")
                if term.lower() in TERMS
            ],
            "apply_by": parse_datetime(default_fields["apply_by"]),
            "contact": parse_contact(default_fields["contact"]),
        }
        for urop_url, default_fields in urop_default_fields.items()
    }

    # Merge results from previous parsings.
    parsed_urops = {}
    for urop_url in urop_urls:
        parsed_urops[urop_url] = urop_tdp_fields[urop_url]
        parsed_urops[urop_url].update(urop_default_fields[urop_url])
        parsed_urops[urop_url].update(urop_corrected_fields[urop_url])

    # Add parsed UROPs to database. If already exists, update all fields and last_seen. posted should never be updated.
    now_datetime = datetime.datetime.now()
    for urop_url, parsed_urop in parsed_urops.items():
        db_cursor.execute("""
        INSERT OR REPLACE INTO urops VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            COALESCE((SELECT posted FROM urops WHERE url = ?), ?),
            ?
        );""", (
            urop_url,
            parsed_urop["title"],
            parsed_urop["description"],
            parsed_urop["prereqs"],
            int("".join([
                '1' if TERMS[a] in parsed_urop["term"] else '0'
                for a in range(0, len(TERMS))
            ]), 2),  # Term, one bit for each term.
            parsed_urop["department"],
            parsed_urop["faculty_supervisor"],
            parsed_urop["faculty_email"],
            parsed_urop["apply_by"],
            parsed_urop["contact"],
            urop_url,
            now_datetime,  # Default value for posted.
            now_datetime
        ))


def email_new_urops(db_cursor, previous_scrape_datetime, SMTP_USERNAME, SMTP_PASSWORD):
    """
    Send email about new entries.
    """
    urops = db_cursor.execute("""
    SELECT * FROM urops
        WHERE posted >= ?
        ORDER BY posted DESC, apply_by DESC;
        """, (previous_scrape_datetime,)
    ).fetchall()
    if len(urops) == 0:
        return

    urops_summary = ""
    for urop in urops:
        urops_summary += "* " + urop[1] + "<br>"

    subscribers = [
        result[0] for result in
        db_cursor.execute("SELECT * FROM subscribers;").fetchall()
    ]
    if len(subscribers) == 0:
        return

    try:
        smtp_server = smtplib.SMTP("outgoing.mit.edu", 587)
        smtp_server.starttls()
        smtp_server.login(SMTP_USERNAME, SMTP_PASSWORD)
        email_msg = MIMEMultipart()
        email_msg["From"] = "urop-guide"
        email_msg["To"] = ""
        email_msg["Subject"] = "[urop.guide] " + \
            str(len(urops)) + " New UROP" + \
            ("" if len(urops) == 1 else "s") + " :D"
        email_msg.attach(MIMEText(
            "Visit <a href=\"https://urop.guide\">https://urop.guide</a> for more details!<br><br>" + urops_summary,
            "html"
        ))
        smtp_server.sendmail(
            "urop-guide@mit.edu",
            list(subscribers),
            email_msg.as_string()
        )
        smtp_server.quit()
        print_with_datetime("Emailed " + str(len(subscribers)) +
                            " subscribers about " + str(len(urops)) +
                            " new UROPs.")
    except:
        traceback.print_exc()


def create_data_json(db_cursor, previous_scrape_datetime):
    """
    Scrape and create data_json.
    """
    today = datetime.datetime.today()
    urops = db_cursor.execute("""
    SELECT * FROM urops
        WHERE last_seen >= ?
        ORDER BY posted DESC, apply_by DESC;
        """, (previous_scrape_datetime,)
    ).fetchall()
    return json.dumps([{
        "url": urop[0],
        "title": urop[1],
        "description": urop[2],
        "prereqs": urop[3],
        "term": [
            TERMS[a] for a in range(len(TERMS))
            if urop[4] & (1 << (len(TERMS) - a - 1))
        ],
        "department": urop[5],
        "faculty_supervisor": urop[6],
        "faculty_email": urop[7],
        "apply_by": urop[8],
        "contact": urop[9],
        "posted": parse_datetime(urop[10]),
        "last_seen": parse_datetime(urop[11]),
        "apply_by_passed": urop[8] != "" and unparse_datetime(urop[8]) < today,
    } for urop in urops])


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

    # Load database.
    DB_LOCATION = ".db"
    db_connection = sqlite3.connect(DB_LOCATION)
    db_cursor = db_connection.cursor()
    db_cursor.execute("""
    CREATE TABLE IF NOT EXISTS urops (
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
    db_cursor.execute("""
    CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY)
    ;""")

    # Setup webserver.
    webapp_context = {
        "running": True,
        "data_json": "",
    }
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
        print_with_datetime((
            "Unsubscribed " if in_subscribers else "Subscribed "
        ) + email + ".")
        return flask.Response(status=200)

    # Used in a thread to scrape periodically.
    def scrape_and_update(webapp_context):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        while webapp_context["running"]:
            time.sleep(SCRAPE_PERIOD)
            db_connection = sqlite3.connect(DB_LOCATION)
            db_cursor = db_connection.cursor()
            previous_scrape_datetime = datetime.datetime.now()
            try:
                scrape(db_cursor)
                email_new_urops(
                    db_cursor,
                    previous_scrape_datetime,
                    SMTP_USERNAME,
                    SMTP_PASSWORD)
                webapp_context["data_json"] = create_data_json(
                    db_cursor,
                    previous_scrape_datetime)
            except:
                traceback.print_exc()
            db_connection.commit()
            db_connection.close()

    # Make initial data_json, start scraping thread, before serving.
    previous_scrape_datetime = datetime.datetime.now()
    scrape(db_cursor)
    webapp_context["data_json"] = create_data_json(
        db_cursor,
        previous_scrape_datetime)

    # Cleanup.
    db_connection.commit()
    db_connection.close()

    updater = threading.Thread(
        target=scrape_and_update,
        args=(webapp_context,)
    )
    updater.daemon = True
    updater.start()

    waitress.serve(webapp, host="0.0.0.0", port=PORT)
    webapp_context["running"] = False


if __name__ == "__main__":
    main(sys.argv[1:])
