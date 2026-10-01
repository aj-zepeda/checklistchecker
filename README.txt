NASCAR Trading Card Checklist Browser
=====================================

READY FOR GITHUB PAGES

This project contains the original 47 checklist CSV files plus 2026 Panini Track Kings Racing.
Visitors do NOT need to upload any files.

FILES
-----
index.html
style.css
app.js
checklists.json
checklists/   (48 CSV files)

FILTERS
-------
- Year
- Product (PROGRAM, such as Select / Prizm / Donruss / Turn Four)
- Card Set (CARD SET; searchable)
- Athlete search

The filters work together. For example:
2025 -> Panini Select -> a specific CARD SET -> athlete

DEPLOY TO GITHUB PAGES
----------------------
1. Create/open your GitHub repository.
2. Upload EVERYTHING inside this project folder to the repository root.
   Important: include the entire "checklists" folder and checklists.json.
3. Commit the files.
4. Go to Settings -> Pages.
5. Under Build and deployment:
   Source: Deploy from a branch
   Branch: main
   Folder: / (root)
6. Click Save.
7. GitHub will publish the site and provide its URL.

IMPORTANT
---------
Do not test this by double-clicking index.html from File Explorer.
Browsers normally block fetch() from local file:// pages.

Test it through GitHub Pages, or through a local web server.

DATA
----
Checklist CSVs: 48
Expected columns:
SPORT, YEAR, BRAND, PROGRAM, CARD SET, ATHLETE, TEAM, POSITION,
CARD NUMBER, SEQUENCE

All checklist data is static and publicly downloadable from the GitHub
Pages repository/site. Do not include private data in the CSV files.

