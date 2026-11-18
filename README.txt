Recall – UPSC CSE revision portal (static site, no build step)

Deploy on Vercel – Option A (no terminal, ~3 minutes):
 1. Create a new repository on github.com (Private is fine) named recall-upsc.
 2. On the repository page click "uploading an existing file", drag in EVERYTHING
    inside this folder (index.html, the .json files, vercel.json and the media folder), then Commit.
 3. Go to vercel.com/new, import the recall-upsc repository, leave all settings as they are
    (Framework: Other, no build command), and click Deploy.

Option B (terminal, needs Node.js):
    cd recall-upsc
    npx vercel --prod
 (log in when the browser opens; accept the defaults)

Note: progress is saved in each student's browser (localStorage) – no accounts yet.
