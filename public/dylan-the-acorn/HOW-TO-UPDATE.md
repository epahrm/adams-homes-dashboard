# Dylan the Acorn Website — How to Update It

This is the official website for **Dylan and the Big Feelings** by Seth Porter.
Everything lives in one file: `index.html`. You can edit it with any text
editor (Notepad, TextEdit, VS Code) — no coding experience needed.

## Add real reviews (important for credibility!)

1. Open `index.html` and search for `const REVIEWS`.
2. Copy a review from Amazon (or a teacher, blogger, etc.) and add it like this:

```js
const REVIEWS = [
  {
    stars: 5,
    text: "My 8-year-old asks for this book every night!",
    name: "Jamie R.",
    source: "Amazon Customer Review"
  },
  {
    stars: 5,
    text: "A wonderful tool for teaching emotional regulation.",
    name: "Mrs. Thompson, 2nd Grade Teacher",
    source: "School visit feedback"
  },
];
```

3. Save the file. The reviews appear automatically with star ratings.
   While the list is empty, the site shows a friendly "reviews are sprouting"
   message instead — it never looks broken.

> Tip: only use reviews you have permission to share, and keep the reviewer's
> name the way they published it (e.g., first name + last initial).

## Add book signings & events

Search for `const EVENTS` in `index.html` and add:

```js
const EVENTS = [
  {
    month: "Sep", day: "14",
    title: "Story Time & Book Signing",
    details: "Main Street Library, 10:30 AM — Meet Seth Porter and Dylan!"
  },
];
```

## Add characters

Search for `TO ADD MORE CHARACTERS` in `index.html`. Copy one of the
character cards, remove `class="mystery"` → keep `class="char-card"`, and
fill in the name, role, and description. Swap the emoji for any you like.

## Add merchandise later

In the **Shop** section, copy the "Dylan Merch" card, replace the emoji,
title, and description, and change the button link to your store
(Etsy, Shopify, Amazon Merch, etc.).

## Change the contact email

The site currently uses `elizporter15@gmail.com` for event requests, the
merch waitlist, and the newsletter. Search for that address in `index.html`
and replace all occurrences to change it.

## Collect newsletter signups automatically (optional)

Right now the "Join the Newsletter" button opens the visitor's email app.
For automatic signup collection, create a free form at https://formspree.io
and follow the note marked `NEWSLETTER SETUP` inside `index.html`.

## Publish the site

The site is one folder with no build step, so it works on any free static
host. Easiest options:

- **Netlify Drop** (https://app.netlify.com/drop): drag the `dylan-the-acorn`
  folder onto the page — done, you get a live link instantly.
- **Vercel / GitHub Pages**: point it at this folder.
- You can later buy a domain like `dylantheacorn.com` and connect it in
  your host's settings.

## Book links used on the site

- Dylan and the Big Feelings (paperback):
  https://www.amazon.com/Dylan-Big-Feelings-Adventures-Acorn/dp/B0H2KTZP97
- Adventures with Dylan the Acorn (book 1):
  https://www.amazon.com/Adventures-with-Dylan-the-Acorn/dp/B0H2G8RC2P
- Amazon reviews page:
  https://www.amazon.com/product-reviews/B0H2KTZP97
