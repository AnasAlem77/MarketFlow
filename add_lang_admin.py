import glob

lang_html = """            <!-- Language Switcher -->
            <div class="language-toggle" role="group" aria-label="Language selection">
                <button type="button" class="lang-btn" data-lang="id" aria-label="Bahasa Indonesia" aria-pressed="false">ID</button>
                <button type="button" class="lang-btn" data-lang="en" aria-label="English" aria-pressed="false">EN</button>
            </div>

            <!-- User -->"""

script_html = """    <script src="../assets/js/language.js"></script>
    <script src="../assets/js/admin.js"></script>"""

for file in glob.glob("admin/*.html"):
    if file == "admin/index.html":
        continue
    with open(file, 'r') as f:
        content = f.read()
    
    if 'class="language-toggle"' not in content:
        content = content.replace('            <!-- User -->', lang_html)
    
    if 'language.js' not in content:
        content = content.replace('    <script src="../assets/js/admin.js"></script>', script_html)
        
    with open(file, 'w') as f:
        f.write(content)
