import flask
import json
import waitress
import threading
import time
import datetime

import scrape


def parseDataListFromData(data):
    TODAY = datetime.datetime.today()

    dataList = []

    # format data dictionary into a list, sorted in the right order
    for url in data:
        # only show valid entries
        if data[url]["valid"] == 0:
            continue

        # add the detail_url field once we put it into dataList
        dataList.append(data[url].copy())
        dataList[-1]["detail_url"] = url

        # if an entry has an apply by date past today, then mark it as not due yet
        # otherwise, it has been due, or is empty
        if len(dataList[-1]["apply_by"]) > 0 and datetime.datetime.strptime(dataList[-1]["apply_by"], scrape.TIME_FORMAT) < TODAY:
            dataList[-1]["due_passed"] = 1
        else:
            dataList[-1]["due_passed"] = 0

    # sort dataList by apply by, with empty fields assumed to be right now
    def compareByApplyBy(this):
        apply_by = this["apply_by"]
        if len(apply_by) == 0:
            return TODAY
        return datetime.datetime.strptime(this["apply_by"], scrape.TIME_FORMAT)
    dataList.sort(key=compareByApplyBy, reverse=True)

    # then stable sort dataList by date posted (field is always valid)
    def compareByPosted(this):
        return datetime.datetime.strptime(this["posted"], scrape.TIME_FORMAT)
    dataList.sort(key=compareByPosted, reverse=True)

    return dataList


def scrapeListEmail(data, dataList):
    data, new_entries = scrape.run(data)
    dataList = parseDataListFromData(data)

    # if new_entries is non-empty, send an email to all addresses on the subscriber list with the title of each, and a link to the site
    if len(new_entries) != 0:
        print("Found", len(new_entries), "new postings! Emailing...")

        # TODO


if __name__ == "__main__":
    PORT = 61000
    SCRAPE_INTERVAL = 900  # 15 minutes

    running = True

    # data is a dictionary of urop postings, a mapping from the detail_url to a dictionary with more specifics
    data = {}

    # dataList is a view on data, presented in the order necessary for the front-end
    dataList = []

    # subs is a set of emails
    subs = set()

    # load the saved data if it exists
    try:
        with open("db/data.json", "r") as dataFile:
            data = json.load(dataFile)
        print("Loaded", len(data), "data entries.")
    except:
        print("Failed to load listings data.")
    dataList = parseDataListFromData(data)
    try:
        with open("db/subscribers.json", "r") as subFile:
            subs = set(json.load(subFile))
        print("Loaded", len(subs), "subscribers.")
    except:
        print("Failed to load subscriber data.")

    app = flask.Flask(__name__, static_url_path="")

    @app.route("/")
    def index_bypass():
        return flask.send_from_directory("static", "index.html")

    @app.route("/data.json")
    def send_data():
        return flask.Response(json.dumps(dataList), status=200, mimetype="application/json")

    @app.route("/<path>")
    def send_static(path):
        return flask.send_from_directory("static", path)

    @app.route("/subscription/count.json")
    def get_sub_count():
        return flask.Response(json.dumps(len(subs)), status=200, mimetype="application/json")

    @app.route("/subscription/check/<email>")
    def check_sub_email(email):
        """
        Returns 0 iff the email is not already subscribed, 1 otherwise.
        """
        return flask.Response(json.dumps(1 if email in subs else 0), status=200, mimetype="application/json")

    @app.route("/subscription/toggle/<email>")
    def toggle_sub_email(email):
        if email in subs:
            subs.remove(email)
        else:
            subs.add(email)
        return flask.Response(status=200)

    def run_scraper():
        while running:
            time.sleep(SCRAPE_INTERVAL)

            # scrape the website!
            scrapeListEmail(data, dataList)

    # run scraper once so we have some info
    scrapeListEmail(data, dataList)

    scraper = threading.Thread(target=run_scraper)
    scraper.daemon = True
    scraper.start()

    # app.run()
    # app.run(host="0.0.0.0", port=PORT)
    waitress.serve(app, host="0.0.0.0", port=PORT)

    # stop the scraper!
    print("Saving data and subscribers...")
    running = False

    with open("db/data.json", "w") as dataFile:
        json.dump(data, dataFile)
    with open("db/subscribers.json", "w") as subFile:
        json.dump(list(subs), subFile)
