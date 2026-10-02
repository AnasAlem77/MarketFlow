import os
import glob

search_li = '                        <li><a href="search.html" class="footer-link"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg><span data-i18n="footer.search">Search</span></a></li>\n'

for file in glob.glob("*.html"):
    with open(file, 'r') as f:
        content = f.read()
    
    if '<li><a href="about.html"' in content and '<li><a href="search.html"' not in content:
        content = content.replace('                        <li><a href="about.html"', search_li + '                        <li><a href="about.html"')
        with open(file, 'w') as f:
            f.write(content)
