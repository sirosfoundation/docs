SIROS Developer Docs
====================

## Available Scripts


| Command                     | Description                                      |
|-----------------------------|--------------------------------------------------|
| npm run docusaurus          | Run Docusaurus commands.                         |
| npm start                   | Start the development server.                    |
| npm run build               | Build the static site for production.            |
| npm run swizzle             | Customize Docusaurus components.                 |
| npm run deploy              | Deploy the site to your hosting service.         |
| npm run clear               | Clear the build output directory.                |
| npm run serve               | Serve the built site locally.                    |
| npm run write-translations | Extract translation messages.                    |
| npm run write-heading-ids  | Generate heading IDs for markdown files.         |
| npm run typecheck           | Run TypeScript type checking.                    |

---

## Usage

### Start the Development Server
Run the following command to start the development server:
npm start

This will start a local server, usually at [http://localhost:3000](http://localhost:3000).

---

### Build the Site
To build the site for production, run:
npm run build

This generates static content in the `build` directory.

---

### Deploy the Site
To deploy the site, run:
npm run deploy

This will build and deploy your site to your configured hosting service.

---

### Customize Components
To customize Docusaurus components, run:
npm run swizzle

Follow the prompts to select the component you want to customize.

---

### Type Checking
To run TypeScript type checking, use:
npm run typecheck

---