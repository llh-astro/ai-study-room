package cn.aistudy.practice;

import android.app.Activity;
import android.content.Intent;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.webkit.*;
import android.view.View;
import android.view.WindowInsets;
import android.graphics.Color;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import javax.net.ssl.HttpsURLConnection;
import java.security.KeyStore;
import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import org.json.*;

/** Native shell exposes a narrowly scoped bridge only to bundled https://study.local content. */
public class MainActivity extends Activity {
 private WebView web;
 private SQLiteDatabase db;
 private final ExecutorService work=Executors.newCachedThreadPool();
 private final ConcurrentHashMap<String,HttpsURLConnection> calls=new ConcurrentHashMap<>();
 private final Set<String> cancelled=ConcurrentHashMap.newKeySet();
 private String exportText;
 private static final String ORIGIN="https://study.local/", ALIAS="aistudy-deepseek-v1";
 private static final Set<String> KEYS=new HashSet<>(Arrays.asList("ai-training-100-v1","ai-enterprise-210-v1","ai-basics-300-v1","ai-practice-150-v1","leetcode-hot100-python-v1","study-personal-v1","study-settings-v1","study-bank-v1"));
 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  db=openOrCreateDatabase("study.db",MODE_PRIVATE,null);
  db.execSQL("CREATE TABLE IF NOT EXISTS records (k TEXT PRIMARY KEY, v TEXT NOT NULL)");
  web=new WebView(this);web.setBackgroundColor(Color.WHITE);
  android.widget.FrameLayout container=new android.widget.FrameLayout(this);
  container.addView(web,new android.widget.FrameLayout.LayoutParams(-1,-1));setContentView(container);
  if(Build.VERSION.SDK_INT>=30){
   getWindow().setDecorFitsSystemWindows(false);
   container.setOnApplyWindowInsetsListener((v,insets)->{android.graphics.Insets i=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.ime()|WindowInsets.Type.displayCutout());v.setPadding(i.left,i.top,i.right,i.bottom);return WindowInsets.CONSUMED;});
   container.requestApplyInsets();
  }
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setJavaScriptCanOpenWindowsAutomatically(false);s.setSupportMultipleWindows(false);
  CookieManager.getInstance().setAcceptCookie(false);
  WebView.setWebContentsDebuggingEnabled(false);
  web.addJavascriptInterface(new Bridge(),"AndroidStudy");
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest req){
    Uri uri=req.getUrl();
    if("https".equals(uri.getScheme())&&"study.local".equals(uri.getHost())&&(uri.getPath().equals("/")||uri.getPath().equals("/index.html"))){
     try{Map<String,String> headers=new HashMap<>();headers.put("Content-Security-Policy","default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");return new WebResourceResponse("text/html","UTF-8",200,"OK",headers,getAssets().open("index.html"));}catch(Exception e){return blocked();}
    }
    return blocked();
   }
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest req){
    Uri u=req.getUrl();if(ORIGIN.equals(u.toString())||(ORIGIN+"index.html").equals(u.toString()))return false;
    if(req.isForMainFrame()&&"https".equals(u.getScheme())&&java.util.Arrays.asList("leetcode.cn","www.deeplearningbook.org","scikit-learn.org","docs.pytorch.org","huggingface.co","docs.langchain.com","www.elastic.co","nlp.stanford.edu","microsoft.github.io","www.postgresql.org","www.w3.org","arxiv.org","genai.owasp.org","packaging.python.org","docs.python.org","fastapi.tiangolo.com","json-schema.org","docs.pytest.org","docs.docker.com","git-scm.com","docs.scipy.org","www.itl.nist.gov","otexts.com","facebook.github.io","doi.org").contains(u.getHost()))try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}
    return true;
   }
   @Override public void onReceivedSslError(WebView v,android.webkit.SslErrorHandler handler,android.net.http.SslError error){handler.cancel();}
  });
  web.setWebChromeClient(new WebChromeClient());web.loadUrl(ORIGIN+"index.html");
 }
 private WebResourceResponse blocked(){return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 private JSONObject obj(String... values){JSONObject o=new JSONObject();try{for(int i=0;i<values.length;i+=2)o.put(values[i],values[i+1]);}catch(Exception ignored){}return o;}
 private void emit(JSONObject event){
  String raw=event.toString();
  if(raw.length()<48000){runOnUiThread(()->{if(web!=null)web.evaluateJavascript("window.StudyBridgeEvent && window.StudyBridgeEvent("+raw+");",null);});return;}
  // Large bank/backup imports cross the renderer boundary in bounded chunks.
  List<String> parts=new ArrayList<>();for(int start=0;start<raw.length();){int end=Math.min(start+24000,raw.length());if(end<raw.length()&&Character.isHighSurrogate(raw.charAt(end-1)))end--;parts.add(raw.substring(start,end));start=end;}
  String transfer=UUID.randomUUID().toString();for(int i=0;i<parts.size();i++){final int index=i;final String part=parts.get(i);runOnUiThread(()->{if(web!=null)web.evaluateJavascript("window.StudyBridgeChunk && window.StudyBridgeChunk("+JSONObject.quote(transfer)+","+index+","+parts.size()+","+JSONObject.quote(part)+");",null);});}
 }
 private String getRecord(String key){synchronized(db){try(Cursor c=db.rawQuery("SELECT v FROM records WHERE k=?",new String[]{key})){return c.moveToFirst()?c.getString(0):null;}}}
 private void putRecord(String key,String value){ContentValues v=new ContentValues();v.put("k",key);v.put("v",value);if(db.insertWithOnConflict("records",null,v,SQLiteDatabase.CONFLICT_REPLACE)<0)throw new IllegalStateException();}
 private SecretKey secret() throws Exception {KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);if(!ks.containsAlias(ALIAS)){KeyGenerator g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");g.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());g.generateKey();}return (SecretKey)ks.getKey(ALIAS,null);}
 private String readKey() throws Exception {String encoded=getRecord("private-api-key");if(encoded==null)return "";String[] parts=encoded.split(":");Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,secret(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));return new String(c.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),StandardCharsets.UTF_8);}
 private HttpsURLConnection connection(String url) throws Exception {URL u=new URL(url);if(!u.getProtocol().equals("https")||u.getUserInfo()!=null)throw new IOException("HTTPS required");HttpsURLConnection c=(HttpsURLConnection)u.openConnection();c.setInstanceFollowRedirects(false);c.setUseCaches(false);c.setConnectTimeout(20000);c.setReadTimeout(60000);c.setRequestProperty("Accept","application/json");return c;}
 private String readLimited(InputStream in,int limit) throws Exception {try(InputStream src=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=src.read(b))!=-1){if(out.size()+n>limit)throw new IOException("文件超过大小限制");out.write(b,0,n);}return out.toString("UTF-8");}}
 private String apiError(int n){switch(n){case 401:return "API Key 无效或已失效，请在设置中更换。";case 402:return "DeepSeek 账户余额不足。";case 429:return "请求过于频繁，请稍后重试。";case 400:return "模型或请求参数不受支持，请检查设置。";default:return "服务请求失败（"+n+"），请稍后重试。";}}
 public class Bridge {
  @JavascriptInterface public String get(String key){return KEYS.contains(key)?getRecord(key):null;}
  @JavascriptInterface public boolean put(String key,String value){if(!KEYS.contains(key)||value==null||value.length()>16000000)return false;try{synchronized(db){putRecord(key,value);}return true;}catch(Exception e){return false;}}
  @JavascriptInterface public boolean drop(String key){if(!KEYS.contains(key))return false;try{synchronized(db){db.delete("records","k=?",new String[]{key});}return true;}catch(Exception e){return false;}}
  @JavascriptInterface public boolean batch(String raw){if(raw.length()>32000000)return false;try{JSONObject values=new JSONObject(raw);for(Iterator<String> it=values.keys();it.hasNext();)if(!KEYS.contains(it.next()))return false;synchronized(db){db.beginTransaction();try{for(Iterator<String> it=values.keys();it.hasNext();){String key=it.next();putRecord(key,values.getString(key));}db.setTransactionSuccessful();}finally{db.endTransaction();}}return true;}catch(Exception e){return false;}}
  @JavascriptInterface public boolean hasKey(){return getRecord("private-api-key")!=null;}
  @JavascriptInterface public boolean saveKey(String key){if(key==null||key.length()>512)return false;try{synchronized(db){if(key.isEmpty()){db.delete("records","k=?",new String[]{"private-api-key"});return true;}Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,secret());String v=Base64.encodeToString(c.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(c.doFinal(key.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP);putRecord("private-api-key",v);}return true;}catch(Exception e){return false;}}
  @JavascriptInterface public void testKey(String id){work.execute(()->{HttpsURLConnection c=null;try{String key=readKey();if(key.isEmpty()){emit(obj("type","test","id",id,"error","尚未保存 API Key，请输入后重新测试。"));return;}c=connection("https://api.deepseek.com/models");c.setConnectTimeout(12000);c.setReadTimeout(12000);calls.put(id,c);if(cancelled.contains(id))return;c.setRequestProperty("Authorization","Bearer "+key);int status=c.getResponseCode();if(!cancelled.contains(id))emit(status==200?obj("type","test","id",id):obj("type","test","id",id,"error",apiError(status)));}catch(Exception e){String message="连接失败，请检查网络或重新保存 Key。";if(e instanceof java.net.SocketTimeoutException)message="连接超时，请切换 Wi-Fi 或移动数据后重试。";else if(e instanceof java.net.UnknownHostException)message="无法解析 DeepSeek 地址，请检查手机网络或 DNS 设置。";else if(e instanceof javax.net.ssl.SSLException)message="安全连接失败，请检查手机日期时间、网络或代理设置。";else if(e instanceof java.security.GeneralSecurityException)message="无法读取加密保存的 Key，请重新输入并保存。";if(!cancelled.contains(id))emit(obj("type","test","id",id,"error",message));}finally{calls.remove(id);cancelled.remove(id);if(c!=null)c.disconnect();}});}
  @JavascriptInterface public void ai(String id,String payload){if(id==null||id.length()>100||payload==null||payload.length()>150000)return;work.execute(()->{HttpsURLConnection c=null;try{
   if(cancelled.contains(id))return;
   JSONObject body=new JSONObject(payload);JSONArray messages=body.getJSONArray("messages");if(messages.length()>20)throw new IOException();String model=body.getString("model");if(!Arrays.asList("deepseek-v4-flash","deepseek-v4-pro","deepseek-chat","deepseek-reasoner").contains(model))throw new IOException();
   String key=readKey();if(key.isEmpty())throw new IOException();c=connection("https://api.deepseek.com/chat/completions");calls.put(id,c);if(cancelled.contains(id))return;c.setRequestMethod("POST");c.setDoOutput(true);c.setRequestProperty("Content-Type","application/json");c.setRequestProperty("Authorization","Bearer "+key);c.setRequestProperty("Accept","text/event-stream");
   try(OutputStream out=c.getOutputStream()){out.write(body.toString().getBytes(StandardCharsets.UTF_8));}int status=c.getResponseCode();if(status!=200){emit(obj("id",id,"type","error","error",apiError(status)));return;}
   boolean done=false;int size=0;try(BufferedReader reader=new BufferedReader(new InputStreamReader(c.getInputStream(),StandardCharsets.UTF_8))){String line;while((line=reader.readLine())!=null){if(cancelled.contains(id))return;if(!line.startsWith("data:"))continue;String data=line.substring(5).trim();if(data.equals("[DONE]")){done=true;break;}if(data.isEmpty())continue;JSONObject item=new JSONObject(data);JSONArray choices=item.optJSONArray("choices");if(choices==null||choices.length()==0)continue;JSONObject choice=choices.getJSONObject(0),delta=choice.optJSONObject("delta");if(delta!=null){String text=delta.optString("content","");if(!text.isEmpty()&&!text.equals("null")){size+=text.length();if(size>200000)throw new IOException();emit(obj("id",id,"type","delta","content",text));}}if("length".equals(choice.optString("finish_reason"))){emit(obj("id",id,"type","error","error","回答达到长度限制，部分内容已保存，可以继续追问。"));return;}}}
   emit(done?obj("id",id,"type","done"):obj("id",id,"type","error","error","连接提前结束，已保存收到的内容。"));
  }catch(Exception e){if(!cancelled.contains(id))emit(obj("id",id,"type","error","error","请求中断。请检查网络、模型或 API Key；已收到的内容会保留。"));}finally{calls.remove(id);cancelled.remove(id);if(c!=null)c.disconnect();}});}
  @JavascriptInterface public void cancel(String id){cancelled.add(id);HttpsURLConnection c=calls.get(id);if(c!=null)work.execute(c::disconnect);}
  @JavascriptInterface public void update(String url){if(url==null||url.length()>2048)return;work.execute(()->{HttpsURLConnection c=null;try{c=connection(url);int status=c.getResponseCode();if(status!=200)throw new IOException("题库下载失败（"+status+"）。请填写直接返回 JSON 的 HTTPS 地址。");emit(obj("type","update","content",readLimited(c.getInputStream(),12000000)));}catch(Exception e){emit(obj("type","update","error",e.getMessage()==null?"无法下载题库，请检查网络和地址。":e.getMessage()));}finally{if(c!=null)c.disconnect();}});}
  @JavascriptInterface public void exportFile(String name,String mime,String text){if(text==null||text.length()>32000000)return;runOnUiThread(()->{exportText=text;Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType(mime.equals("text/markdown")?"text/markdown":"application/json");intent.putExtra(Intent.EXTRA_TITLE,name.replaceAll("[/\\\\]","_"));try{startActivityForResult(intent,10);}catch(Exception e){exportText=null;emit(obj("type","export","error","系统文件保存器不可用。"));}});}
  @JavascriptInterface public void importFile(){runOnUiThread(()->{Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");try{startActivityForResult(intent,11);}catch(Exception e){emit(obj("type","export","error","系统文件选择器不可用。"));}});}
 }
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(result!=RESULT_OK||data==null){exportText=null;return;}Uri uri=data.getData();if(request==10){final String text=exportText;exportText=null;work.execute(()->{try(OutputStream out=getContentResolver().openOutputStream(uri)){out.write(text.getBytes(StandardCharsets.UTF_8));emit(obj("type","export"));}catch(Exception e){emit(obj("type","export","error","文件保存失败，请重新导出。"));}});}else if(request==11)work.execute(()->{try{emit(obj("type","import","content",readLimited(getContentResolver().openInputStream(uri),16000000)));}catch(Exception e){emit(obj("type","export","error","无法读取该文件，或超过 16 MB 限制。"));}});}
 @Override public void onBackPressed(){web.evaluateJavascript("(function(){return window.StudyBack?window.StudyBack():false;})()",v->{if(!"true".equals(v))MainActivity.super.onBackPressed();});}
 @Override protected void onDestroy(){for(HttpsURLConnection c:calls.values())c.disconnect();work.shutdownNow();if(web!=null){web.removeJavascriptInterface("AndroidStudy");web.destroy();web=null;}super.onDestroy();}
}
