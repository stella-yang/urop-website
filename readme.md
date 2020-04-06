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

Then,

```bash
python main.py
```

### Command line options

Option|Default|Usage
-|-|-
`--port`|`61000`|The port on which to serve.
`--interval`|`3600`|Seconds before scraping the website.
`--username`|None|Kerberos, or username to login to MIT SMTP.
`--password`|None|MIT SMTP password.

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
