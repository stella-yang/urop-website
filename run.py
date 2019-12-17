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

    app = flask.Flask(__name__, static_url_path="")

    @app.route("/")
    def index_bypass():
        return flask.send_from_directory("static", "index.html")

    @app.route("/data.json")
    def send_data():
        return flask.Response(json.dumps(data), status=200, mimetype="application/json")

    @app.route("/<path:path>")
    def send_static(path):
        return flask.send_from_directory("static", path)

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
