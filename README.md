# Caruso

Caruso is a simple, minimalist web application for creating beautiful photo collages. It features an intuitive, responsive design that lets you seamlessly upload top and bottom photos and export your collage with ease.

## Features
- **Minimalist UI**: Clean, distraction-free interface.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.
- **Easy Export**: Export your collage as a high-quality image with a single click.
- **Progressive Web App (PWA)**: Installable on supported devices.

## Running Locally

To run the web app, simply open `Caruso-Web/index.html` in your web browser, or use a local development server from the root of this project:
```bash
npx serve .
```

## Making It Live (GitHub Pages Deployment)

To publish this project to GitHub Pages and make it live on the internet, follow these steps:

1. **Initialize Git & Push to GitHub**:
   - Open your terminal/command prompt in your `Caruso` directory.
   - Run the following commands to create a local commit:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     ```
   - Go to [GitHub](https://github.com/) and create a new public repository (name it `Caruso`).
   - Link your local code to your new GitHub repository and push:
     ```bash
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/Caruso.git
     git push -u origin main
     ```

2. **Enable GitHub Pages**:
   - On your GitHub repository page, go to **Settings** (the gear tab at the top).
   - In the left sidebar, click on **Pages**.
   - Under the **Build and deployment** section, make sure **Source** is set to "Deploy from a branch".
   - Under **Branch**, select `main` (or `master`) and keep the folder drop-down as `/ (root)`.
   - Click **Save**.

3. **Access Your Live Site**:
   - GitHub will take a minute or two to build and deploy your site.
   - You will see a notification at the top of the Pages settings with your live URL once it's done.
   - Your web app will be accessible at: `https://YOUR_USERNAME.github.io/Caruso/Caruso-Web/`

*(Note: Deploying the root folder and accessing the app via the `/Caruso-Web/` URL ensures that all images and fonts located in the `Assets` directory are loaded correctly.)*
