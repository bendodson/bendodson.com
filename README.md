# bendodson.com redesign

This is a clean Jekyll working copy for the visual redesign.

## Build

Use the bundled Jekyll command from this directory:

```sh
bin/jekyll build
```

Or, equivalently:

```sh
bundle exec jekyll build
```

Do not run bare `jekyll build` in this directory. That can load globally installed gems before Bundler has a chance to select this project’s local dependencies, which causes version conflicts such as `public_suffix` being activated at the wrong version.

## Post newsletter include

Drop the newsletter signup module into a post with:

```liquid
{% include newsletter-post.html %}
```

You can override the text for a specific article:

```liquid
{% include newsletter-post.html text="A short sentence explaining why this newsletter is relevant to this article." %}
```

Longer text can be captured first:

```liquid
{% capture newsletter_text %}A slightly longer custom message for this article.{% endcapture %}
{% include newsletter-post.html text=newsletter_text %}
```

The website renders the full signup form. The RSS feed keeps only the text and a “Subscribe now” link.

## Dependencies

Dependencies are installed locally in `vendor/bundle` and are excluded from Jekyll output.
