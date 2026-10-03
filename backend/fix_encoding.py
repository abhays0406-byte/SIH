import os, sys
bad = []
for root, dirs, files in os.walk('app'):
    for f in files:
        if f.endswith('.py'):
            p = os.path.join(root, f)
            d = open(p, 'rb').read()
            if b'\x00' in d:
                bad.append(p)
                # fix it
                try:
                    text = d.decode('utf-16')
                    open(p, 'w', encoding='utf-8', newline='\n').write(text)
                    print('FIXED:', p)
                except Exception as e:
                    print('ERR:', p, e)
if not bad:
    print('ALL CLEAN')
