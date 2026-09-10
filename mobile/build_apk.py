"""Reproducible local APK packaging with official Android tools and JDK; no Gradle required."""
import os
import subprocess
import zipfile
import shutil
import secrets
import hashlib
import json
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT=Path(__file__).resolve().parent
TOOLS=ROOT/'toolchain'
OUT=ROOT/'build'
def find(root,name):
    return next(root.rglob(name))
JAVAC=find(TOOLS/'jdk','javac.exe'); JAVA=JAVAC.with_name('java.exe')
ANDROID=find(TOOLS/'platform','android.jar'); AAPT=find(TOOLS/'build-tools','aapt.exe')
BT=AAPT.parent
def run(args,**kwargs):
    # Android's Windows native tools interpret non-ASCII absolute paths incorrectly.
    # Relative ASCII paths preserve the user's existing Chinese workspace location.
    if Path(args[0]).name in ['aapt.exe','zipalign.exe']:
        args=[args[0]]+[a.relative_to(ROOT) if isinstance(a,Path) and a.is_relative_to(ROOT) else a for a in args[1:]]
        kwargs['cwd']=ROOT
    result=subprocess.run([str(a) for a in args],check=True,**kwargs)
    return result
def build():
    for name in ['assets','classes','dex','generated']:(OUT/name).mkdir(parents=True,exist_ok=True)
    shutil.copy2(ROOT.parent/'index.html',OUT/'assets/index.html')
    run([AAPT,'package','-f','-M',ROOT/'AndroidManifest.xml','-I',ANDROID,'-S',ROOT/'res','-A',OUT/'assets','-F',OUT/'resources.apk','-J',OUT/'generated'])
    run([JAVAC,'-encoding','UTF-8','-source','8','-target','8','-classpath',ANDROID,'-d',OUT/'classes',*list((ROOT/'src').rglob('*.java'))])
    with zipfile.ZipFile(OUT/'classes.jar','w') as z:
        for f in (OUT/'classes').rglob('*.class'):z.write(f,f.relative_to(OUT/'classes').as_posix())
    run([JAVA,'-cp',BT/'lib/d8.jar','com.android.tools.r8.D8','--release','--min-api','26','--lib',ANDROID,'--output',OUT/'dex',OUT/'classes.jar'])
    shutil.copy2(OUT/'resources.apk',OUT/'unsigned.apk')
    with zipfile.ZipFile(OUT/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:
        for f in (OUT/'dex').glob('*.dex'):z.write(f,f.name)
    run([BT/'zipalign.exe','-f','-p','4',OUT/'unsigned.apk',OUT/'aligned.apk'])
    signing=ROOT/'signing';signing.mkdir(exist_ok=True)
    password=signing/'password.txt';keystore=signing/'release.p12'
    if not password.exists():password.write_text(secrets.token_urlsafe(32),encoding='ascii')
    env=os.environ.copy();env['STUDY_SIGN_PASSWORD']=password.read_text().strip()
    if not keystore.exists():run([JAVA.with_name('keytool.exe'),'-genkeypair','-keystore',keystore,'-storetype','PKCS12','-alias','aistudy','-keyalg','RSA','-keysize','3072','-validity','10000','-storepass:env','STUDY_SIGN_PASSWORD','-dname','CN=AI Study Personal, O=Personal Learning, C=CN'],env=env)
    delivery=ROOT.parent/'release';delivery.mkdir(exist_ok=True)
    apk=OUT/'signed.apk'
    run([JAVA,'-jar',BT/'lib/apksigner.jar','sign','--ks',keystore,'--ks-key-alias','aistudy','--ks-pass','env:STUDY_SIGN_PASSWORD','--out',apk,OUT/'aligned.apk'],env=env)
    run([JAVA,'-jar',BT/'lib/apksigner.jar','verify','--verbose',apk])
    run([AAPT,'dump','badging',apk],stdout=(OUT/'apk-info.txt').open('w',encoding='utf-8'))
    version=ET.parse(ROOT/'AndroidManifest.xml').getroot().get('{http://schemas.android.com/apk/res/android}versionName')
    final=delivery/('AI练习室-v'+version+'.apk')
    shutil.copy2(apk,final)
    (delivery/'SHA256.txt').write_text(hashlib.sha256(apk.read_bytes()).hexdigest()+'  '+final.name+'\n',encoding='utf-8')
    print('APK built and signature verified:',apk)
if __name__=='__main__':build()
