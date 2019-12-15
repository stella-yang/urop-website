import flask
import json
import waitress
import threading
import time
import scrape

PORT = 61000
SCRAPE_INTERVAL = 60

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

# prep the scraper to run in the background


def run_scraper():
    while running:
        time.sleep(SCRAPE_INTERVAL)

        # scrape the website!
        data = scrape.run()


# run it once so we have some info
data = scrape.run()

scraper = threading.Thread(target=run_scraper)
scraper.daemon = True
scraper.start()

# app.run()
# app.run(host="0.0.0.0", port=61000)
waitress.serve(app, host="0.0.0.0", port=PORT)

# stop the scraper!
print("Stopping scraper (up to", SCRAPE_INTERVAL, "seconds)...")
running = False

# scraper.join()
