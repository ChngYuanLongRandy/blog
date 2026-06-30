# The Ordinary Singaporean Dad

A Hugo blog using the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme, deployed to EC2 via GitHub Actions.

## Local Development

```bash
hugo server -D
```

The site will be available at `http://localhost:1313`. The `-D` flag includes draft posts.

## Creating a New Post

```bash
hugo new content/posts/my-post.md
```

Edit the generated file. Set `draft: false` when the post is ready to publish.

## Publishing Workflow

1. Write your post and set `draft: false`
2. Commit and push to a feature branch
3. Raise a Pull Request → merge to `main`
4. GitHub Actions automatically builds and deploys to EC2

## First-Time Server Setup

1. **Authorise GitHub Actions** — add the public key corresponding to `EC2_SSH_KEY` to `~/.ssh/authorized_keys` on your EC2 instance
2. **Create the target directory** — ensure `EC2_TARGET_PATH` exists and is writable by `EC2_USER`
3. **Configure a web server** — point Nginx or Caddy to serve `EC2_TARGET_PATH`

Example Nginx snippet:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/blog;
    index index.html;
}
```

## GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `EC2_HOST` | Public IP or hostname of your EC2 instance |
| `EC2_USER` | SSH user (e.g. `ubuntu`, `ec2-user`) |
| `EC2_SSH_KEY` | Private SSH key (PEM format, no passphrase) |
| `EC2_TARGET_PATH` | Absolute path on EC2 to serve the site from |

## Updating PaperMod

```bash
git submodule update --remote --merge
git add themes/PaperMod
git commit -m "chore: update PaperMod theme"
git push
```

## Project Structure

```
.
├── .github/workflows/deploy.yml   # CI/CD pipeline
├── content/
│   ├── about.md
│   ├── archives.md
│   └── posts/
│       └── *.md
├── layouts/                       # Theme overrides go here
├── assets/                        # Custom CSS/JS overrides go here
├── themes/PaperMod/               # Git submodule — do not edit directly
├── hugo.toml
└── README.md
```
