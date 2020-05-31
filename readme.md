# urop-website

Stella Yang, Yang Yan, Alisa Ono, Angela Cai

<https://urop.guide> is a different view of the UROP website for MIT students! Please email us at urop-guide@mit.edu with any feedback, questions, or concerns.

## Running the server

Setup the Python environment with:

```bash
pip install -r requirements.txt
```

Alternatively, use `conda`:

```bash
conda env create --file=environment.yaml
```

Run the server with

```bash
python main.py
```

### Command line options

Option|Default|Usage
-|-|-
`--port`|`80`|The port on which to serve.
`--period`|`3600`|Seconds before rescraping the website.
`--username`|None|Kerberos, or username to login to MIT SMTP.
`--password`|None|MIT SMTP password.

### Submodules

If you haven't done so, you might want to pull the `rain` Git submodule, which is used for CSS styling.

```bash
git submodule init
git submodule update
```

## Deployment

<https://urop.guide> points to an HTTP multiplexer located at <https://gilgamesh.cc>. The multiplexer can be tunneled to the `urop.guide` server via an SSH tunnel:

```bash
ssh -R urop.guide:80:127.0.0.1:61000 gilgamesh.cc
```

It may be wise to use a more persistent tunnel like `autossh`.

### Database

`urop-website` uses `sqlite3` to manage an on-disk database containing the UROPs and subscribers at `.db`.

### Maintenance

To perform server maintenance, log in to the server with

```bash
ssh -p 2222 gilgamesh@gilgamesh.cc
```

Please request access at urop-guide@mit.edu.

## Changelog

### 2.1.8

* Removed dependency on external CSS.
* Updated python packages.

### 2.1.7

* Fix mobile `font-size` issue.

### 2.1.6

* Remove `rain` dependency; point instead to static hosted CSS.
* Update `python` packages to latest.

### 2.1.5

* Better email HTML and added unsubscribe link.

### 2.1.4

* Slightly modify dark mode colors to better match light mode.
* Slightly larger spacing on term labels.
* Apply insets to input elements.

### 2.1.3

* Ability to switch between dark/light mode.

### 2.1.2

* Added dark mode.
* Responsive panes move critical information to top on smaller screens.

### 2.1.1

* Moved code to separate modules for easier readability.

### 2.1.0

* Update `conda` and `pip` environments.
* Add `rain` dependency for CSS styling.
* Began re-styling for more responsive design.

### 2.0.2

* Fix opacity transition on load.
* Fix scraper not being run due to event loops.

### 2.0.1

* Add loader.

### 2.0.0

* Switched to `sqlite3` on-disk database.
* Moved secrets to command-line options.

### 1.0.2

* If no SMTP credentials supplied, emails will not be sent.
* Server maintenance is now not open to collaborators.

### 1.0.1

* Rename readme to lowercase `readme.md`.
* Fixed environment and requirements to include `python-dateutil`.

### 1.0.0

* Clarified `readme` with updated instructions.
* Rename readme to a temporary name.
