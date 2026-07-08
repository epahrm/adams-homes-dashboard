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

## Official artwork

All official art lives in the `images/` folder (web-optimized copies of the
originals — cropped/resized only, never redrawn). Two extra pieces are
included but not currently used on the page, ready whenever you want them:
`dylan-jump.jpg` and `dylan-red-swirl-wide.jpg`. To add new art anywhere,
drop the file into `images/` and reference it like
`<img src="images/your-file.jpg" alt="description">`.

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

## Publish the site at dylantheacorn.com

The domain **dylantheacorn.com** (registered at Porkbun) is already wired up
in this project's code: when that domain points at this Vercel project, the
book site appears at the domain root automatically (the dashboard and other
pages are not exposed on it). Two one-time steps remain:

1. **Vercel** → the `adams-homes-dashboard` project → Settings → Domains →
   add `dylantheacorn.com` and `www.dylantheacorn.com`.
2. **Porkbun** (porkbun.com → Domain Management → dylantheacorn.com → DNS):
   - Delete Porkbun's default "parked" ALIAS/CNAME records if present.
   - Add an `A` record: host blank (`@`), answer `76.76.21.21`.
   - Add a `CNAME` record: host `www`, answer `cname.vercel-dns.com`.
   (Vercel's Domains screen shows these same values and verifies them.)

DNS usually takes a few minutes to a couple of hours. After that,
https://dylantheacorn.com shows the site with free automatic HTTPS.

Alternative: the folder also works on any static host (e.g. drag
`dylan-the-acorn` onto https://app.netlify.com/drop) — but if you host it
outside this project, change the image paths in `index.html` from
`/dylan-the-acorn/images/...` back to `images/...`.

## Book links used on the site

- Dylan and the Big Feelings (paperback):
  https://www.amazon.com/Dylan-Big-Feelings-Adventures-Acorn/dp/B0H2KTZP97
- Adventures with Dylan the Acorn (book 1):
  https://www.amazon.com/Adventures-with-Dylan-the-Acorn/dp/B0H2G8RC2P
- Amazon reviews page:
  https://www.amazon.com/product-reviews/B0H2KTZP97
