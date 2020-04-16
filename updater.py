import datetime
import sqlite3
import smtplib
import traceback
import time
import threading
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from scrape import *


def email_new_urops(DB_LOCATION, previous_scrape_datetime, SMTP_USERNAME, SMTP_PASSWORD):
    """
    Send email about new entries.
    """
    db_connection = sqlite3.connect(DB_LOCATION)
    db_cursor = db_connection.cursor()

    urops = db_cursor.execute("""SELECT * FROM urops
        WHERE posted >= ?
        ORDER BY posted DESC, apply_by DESC
    ;""", (previous_scrape_datetime,)).fetchall()
    if len(urops) == 0:
        return

    urops_summary = "<ul>"
    for urop in urops:
        urops_summary += "<li>" + urop[1] + "</li>"
    urops_summary += "</ul>"

    subscribers = [
        result[0] for result in
        db_cursor.execute("SELECT * FROM subscribers;").fetchall()
    ]
    if len(subscribers) == 0:
        return

    db_connection.commit()
    db_connection.close()

    try:
        smtp_server = smtplib.SMTP("outgoing.mit.edu", 587)
        smtp_server.starttls()
        smtp_server.login(SMTP_USERNAME, SMTP_PASSWORD)
        for subscriber in subscribers:
            email_msg = MIMEMultipart()
            email_msg["From"] = "urop-guide"
            email_msg["To"] = subscriber
            email_msg["Subject"] = "[urop.guide] " + \
                str(len(urops)) + " New UROP" + \
                ("" if len(urops) == 1 else "s") + " :D"
            email_msg.attach(MIMEText(
                "<p>Visit <a href=\"https://urop.guide\">https://urop.guide</a> for more details! Or, <a href=\"https://urop.guide/subscription/toggle/" + subscriber + "\">unsubscribe</a> from urop.guide.</p>" + urops_summary,
                "html"
            ))
            smtp_server.sendmail(
                "urop-guide@mit.edu",
                subscriber,
                email_msg.as_string()
            )
        smtp_server.quit()
        print_with_datetime("Emailed " + str(len(subscribers)) +
                            " subscribers about " + str(len(urops)) +
                            " new UROPs.")
    except:
        traceback.print_exc()


def create_data_json(DB_LOCATION, previous_scrape_datetime):
    """
    Scrape and create data_json.
    """
    db_connection = sqlite3.connect(DB_LOCATION)
    db_cursor = db_connection.cursor()

    today = datetime.datetime.today()
    urops = db_cursor.execute("""SELECT * FROM urops
        WHERE last_seen >= ?
        ORDER BY posted DESC, apply_by DESC
    ;""", (previous_scrape_datetime,)).fetchall()

    db_connection.commit()
    db_connection.close()
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


def start_updater(DB_LOCATION, SCRAPE_PERIOD, SMTP_USERNAME, SMTP_PASSWORD, webapp_context):
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
                scrape(DB_LOCATION)
                email_new_urops(
                    DB_LOCATION,
                    previous_scrape_datetime,
                    SMTP_USERNAME,
                    SMTP_PASSWORD)
                webapp_context["data_json"] = create_data_json(
                    DB_LOCATION,
                    previous_scrape_datetime)
            except:
                traceback.print_exc()
            db_connection.commit()
            db_connection.close()

    # Make initial data_json, start scraping thread, before serving.
    previous_scrape_datetime = datetime.datetime.now()
    scrape(DB_LOCATION)
    email_new_urops(
        DB_LOCATION,
        previous_scrape_datetime,
        SMTP_USERNAME,
        SMTP_PASSWORD)
    webapp_context["data_json"] = create_data_json(
        DB_LOCATION,
        previous_scrape_datetime)
    updater = threading.Thread(
        target=scrape_and_update,
        args=(webapp_context,)
    )
    updater.daemon = True
    updater.start()
