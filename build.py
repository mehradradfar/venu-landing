import re, pathlib
R = pathlib.Path(__file__).parent
S = R / 'src'
body = (S / 'body.html').read_text()
defs = {}
def grab(m):
    defs[m.group(1)] = m.group(2).strip()
    return ''
body = re.sub(r'<!--#def ([\w-]+)-->(.*?)<!--#end-->\n?', grab, body, flags=re.S)

def expand(s, depth=0):
    if depth > 6: return s
    def use(m):
        name, var = m.group(1), m.group(2)
        d = defs[name]
        if var == 'lt': d = d.replace('class="sb"', 'class="sb lt"', 1)
        return expand(d, depth + 1)
    s = re.sub(r'\{\{use:([\w-]+)(?::([\w-]+))?\}\}', use, s)
    def icon(m):
        cls = ' ' + m.group(2) if m.group(2) else ''
        return f'<svg class="i{cls}" aria-hidden="true"><use href="#i-{m.group(1)}"/></svg>'
    s = re.sub(r'\{\{i:([\w-]+)(?::([\w-]+))?\}\}', icon, s)
    return s

html = expand(body)
assert '{{' not in html, re.findall(r'\{\{[^}]+\}\}', html)[:5]
css = (S / 'styles.css').read_text()
js = (S / 'app.js').read_text()
sprite = (S / 'sprite.svg').read_text()
out = f'''<title>Venu</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Venu helps you find out what to do wherever you go: venues, events and communities near you, and friends to go with.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<style>
{css}
</style>
{sprite}
{html}
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>
<script>
{js}
</script>
'''
(R / 'index.html').write_text(out)
# standalone version (with doctype) for local preview / deployment
(R / 'site.html').write_text('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + out.replace('<style>', '<style>\nimg{max-width:100%}[hidden]{display:none!important}', 1).replace(sprite, '</head>\n<body>\n' + sprite, 1) + '</body>\n</html>\n')
print('built', len(out), 'bytes')
