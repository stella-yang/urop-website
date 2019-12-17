# urop.guide

Stella Yang, Yang Yan, Alisa Ono, Angela Cai

<https://urop.guide> is a different view of the UROP website for MIT students! Please email us at uropguide@mit.edu with any feedback, questions, or concerns.

Secrets are stored in <https://drive.google.com/drive/u/0/folders/149GgVNchNeuyryeI1-OTSWYGok_D3r1J>. Only collaborators have access to this link.

Run the server with:

```bash
pip install -r requirements.txt
python run.py
```

The server will periodically scrape the official UROP postings site at <https://urop.mit.edu/jobs-board>. The default interval is 15 minutes.

The server will run on `:61000` by default. <https://urop.guide> has its DNS pointed to an AWS EC2 instance run by Yang Yan, which is shared with other websites like <https://gilgamesh.cc> and <https://mus.icu>. Ports 80 and 443 run a tunneled HTTP multiplexer. Thus, to point <https://urop.guide> to the local server at `:61000`, run:

```bash
ssh -p 2222 -R urop.guide:80:127.0.0.1:61000 gilgamesh.cc
```

It may be wise to use a more persistent tunnel like `autossh`.

To perform server maintenance, log in to the server with

```bash
ssh urop_guide@gilgamesh.cc
```

The SSH port is password-authenticated. The password is available as the secret `$BACKEND_PASSWORD`. The server is running on a `tmux` session called `urop-website`. The tunnel is running on a `tmux` session called `urop_guide`.
