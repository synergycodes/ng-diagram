# Showcases: contributor guide

The **Showcases** section is where the community shares projects built with ngDiagram.

It is different from **Templates**. Templates are starter kits curated and maintained
by the ngDiagram team, while Showcases is open to everyone. You add your project by
opening a pull request.

> This file is prefixed with `_` so Astro does not turn it into a docs page. It is a
> guide for contributors editing this folder.

## Acceptance criteria

Your project should:

1. **Be built with ngDiagram.** It actually uses the library.
2. **Have at least one working public link.** A live demo (`href`) or a public
   repository (`codeHref`), or both.
3. **Include an image that follows the guidelines below.**

The ngDiagram team reviews each pull request and may decline submissions that are spam
or contain inappropriate content.

## Image guidelines

- Format: **PNG**.
- Size: **~800×450 px** (**16:9**), matching the existing template images
  (e.g. `apps/docs/public/assets/templates/org-chart.png`).
- Location: `apps/docs/public/assets/showcases/`.
- Reference it from the entry by file name only, e.g. `my-project.png`.

## How to add your project

1. **Add your screenshot** to `apps/docs/public/assets/showcases/`.

2. **Add an entry** to `showcases.ts` in this folder. The shape is:

   ```ts
   {
     title: 'My Project',
     description: 'What it is and how it uses ngDiagram. One or two sentences.',
     image: 'my-project.png',
     imageAlt: 'Screenshot of My Project',
     href: 'https://my-project.example.com/', // live demo (optional if codeHref is set)
     codeHref: 'https://github.com/me/my-project', // repo (optional if href is set)
     author: 'Your Name',
     authorUrl: 'https://github.com/your-handle', // optional
   }
   ```

   Provide `href`, `codeHref`, or both. At least one is required.

3. **Open a pull request** with your image and the new entry.

That's it. Thanks for sharing what you built! 🎉
