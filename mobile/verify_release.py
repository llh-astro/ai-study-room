from pathlib import Path
import subprocess, zipfile, hashlib
import build_apk as b

r=b.ROOT.parent
apks=[r/'release'/('AI练习室-v'+v+'.apk') for v in ['1.0.3','1.0.4']]
certs=[]
for apk in apks:
    result=subprocess.run([str(b.JAVA),'-jar',str(b.BT/'lib/apksigner.jar'),'verify','--print-certs',str(apk)],capture_output=True,check=True)
    lines=result.stdout.decode('utf-8',errors='replace').splitlines()
    certs.append(next(x for x in lines if 'certificate SHA-256 digest:' in x))
assert certs[0]==certs[1], 'Signing certificate changed'
with zipfile.ZipFile(apks[1]) as z:
    assert z.read('assets/index.html')==(r/'index.html').read_bytes()
assert hashlib.sha256((r/'questions.json').read_bytes()).hexdigest()=='5576ad962568d0c55cae4be32fbe86e67c15ebcef24f707d1a79718b25a5e7b3'
print('PASS: v1.0.3 and v1.0.4 signing certificates match; bundled page equals verified page; original question data unchanged.')
print('APK size:',apks[1].stat().st_size)
