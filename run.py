import flask
import json
import waitress
import threading
import time
import datetime

import scrape


if __name__ == "__main__":
    PORT = 61000
    SCRAPE_INTERVAL = 900  # 15 minutes

    running = True
    data = ""
    subbed = 0

    app = flask.Flask(__name__, static_url_path="")

    @app.route("/")
    def index_bypass():
        return flask.send_from_directory("static", "index.html")

    @app.route("/data.json")
    def send_data():
        return flask.Response(json.dumps(data), status=200, mimetype="application/json")

    @app.route("/<path>")
    def send_static(path):
        return flask.send_from_directory("static", path)

    @app.route("/subscription/count.json")
    def get_sub_count():
        return flask.Response(json.dumps(3 + subbed), status=200, mimetype="application/json")

    @app.route("/subscription/check/<email>")
    def check_sub_email(email):
        """
        Returns 0 iff the email is not already subscribed, 1 otherwise.
        """
        return flask.Response(json.dumps(subbed), status=200, mimetype="application/json")

    @app.route("/subscription/toggle/<email>")
    def toggle_sub_email(email):
        global subbed
        subbed = (subbed + 1) % 2
        return flask.Response(status=200)

    def run_scraper():
        while running:
            time.sleep(SCRAPE_INTERVAL)

            # scrape the website! preserve old data if failure
            try:
                new_data = scrape.run()
            except:
                pass
            data = new_data
            print("[" + str(datetime.datetime.now()) +
                  "] Finished running scraper.", end="\r")

    # run scraper once so we have some info
    data = scrape.run()

    scraper = threading.Thread(target=run_scraper)
    scraper.daemon = True
    scraper.start()

    # app.run()
    # app.run(host="0.0.0.0", port=PORT)
    waitress.serve(app, host="0.0.0.0", port=PORT)

    # stop the scraper!
    print("\nStopping scraper...")
    running = False
