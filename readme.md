# urop.guide

Stella Yang, Yang Yan, Alisa Ono, Angela Cai

<https://urop.guide> is a different view of the UROP website for MIT students! Please email us at urop-guide@mit.edu with any feedback, questions, or concerns.

## Secrets

Secrets are stored in <https://drive.google.com/drive/u/0/folders/149GgVNchNeuyryeI1-OTSWYGok_D3r1J>. Only collaborators have access to this link.

### SMTP authentication

The `secrets` folder is also to contain one Python file named `__init__.py`. It should follow the following format:

```python
SMTP_SERVER_USERNAME = ""
SMTP_SERVER_PASSWORD = ""
```

The first string should be your Kerberos. The latter should be your Kerberos password. This serves as the authentication for MIT SMTP servers for sending emails.

## Running the server

Run the server with:

```bash
pip install -r requirements.txt
python main.py
```

The server will periodically scrape the official UROP postings site at <https://urop.mit.edu/jobs-board>. The default interval is 1 hour. The server will run on `:61000` by default.

### `conda`

Alternatively, a run the server under a `conda` environment:

```bash
conda env create --file=environment.yaml
```

## Deployment

<https://urop.guide> points to an HTTP multiplexer located at <https://gilgamesh.cc>. The multiplexer can be tunneled to the `urop.guide` server via an SSH tunnel:

```bash
ssh -R urop.guide:80:127.0.0.1:61000 gilgamesh.cc
```

It may be wise to use a more persistent tunnel like `autossh`.

### Maintenance

To perform server maintenance, log in to the server with

```bash
ssh -p 2222 gilgamesh@gilgamesh.cc
```

Please request access at urop-guide@mit.edu.

## Changelog

### 1.0.2

* If no SMTP credentials supplied, emails will not be sent.
* Server maintenance is now not open to collaborators.

### 1.0.1

* Rename readme to lowercase `readme.md`.
* Fixed environment and requirements to include `python-dateutil`.

### 1.0.0

* Clarified `readme` with updated instructions.
* Rename readme to a temporary name.
