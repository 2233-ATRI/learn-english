package app.shici.english2;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.ClipData;
import android.content.ActivityNotFoundException;
import android.content.pm.PackageInfo;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.AtomicFile;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.widget.FrameLayout;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String HOME = ORIGIN + "/shici/index.html";
    private static final int OPEN_FILES = 201, SAVE_FILE = 202;
    private WebView web;
    private FrameLayout root;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private String pickerRequest, exportRequest;
    private boolean pickerBackup, ready;
    private byte[] exportBytes;
    private final ArrayList<Uri> pendingFiles = new ArrayList<>();

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(248,247,243));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setTextZoom(100);
        settings.setBuiltInZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        web.addJavascriptInterface(new Bridge(), "ShiciHost");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                // Exact allowlist, no filesystem paths, no fall-through to network.
                if (HOME.equals(request.getUrl().toString())) {
                    try { return new WebResourceResponse("text/html", "UTF-8", getAssets().open("index.html")); }
                    catch (IOException e) { return blocked(); }
                }
                return blocked();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (HOME.equals(url.toString()) || (ORIGIN.equals(url.getScheme()+"://"+url.getHost()) && "/shici/index.html".equals(url.getPath()))) return false;
                if (request.hasGesture() && Arrays.asList("https", "http", "mailto").contains(url.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, url)); } catch (ActivityNotFoundException ignored) { Toast.makeText(MainActivity.this,"没有应用可以打开这个链接",Toast.LENGTH_SHORT).show(); }
                }
                return true;
            }
        });
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(248,247,243));
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        if(android.os.Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
        else getWindow().getDecorView().setSystemUiVisibility(getWindow().getDecorView().getSystemUiVisibility()|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        root.setOnApplyWindowInsetsListener((view,insets)-> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(bars.left,bars.top,bars.right,bars.bottom);
            } else view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });
        web.loadUrl(HOME);
        collectIntent(getIntent());
        PackageInfo engine = WebView.getCurrentWebViewPackage();
        if (engine != null) { try { if (Integer.parseInt(engine.versionName.split("\\.")[0]) < 120) new AlertDialog.Builder(this).setTitle("请更新系统 WebView").setMessage("拾词英语二需要 Android System WebView 120 或更新版本，以支持阅读界面与 PDF 文字提取。请在系统应用商店更新后重新打开。").setPositiveButton("知道了",null).show(); } catch (RuntimeException ignored) {} }
    }
    private WebResourceResponse blocked() { return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",Collections.emptyMap(),new ByteArrayInputStream(new byte[0])); }
    private final class Bridge {
        @JavascriptInterface public void postMessage(String message) {
            try {
                JSONObject request = new JSONObject(message);
                String id = request.getString("id"), method = request.getString("method");
                JSONObject payload = request.optJSONObject("payload");
                if (payload == null) payload = new JSONObject();
                final JSONObject args = payload;
                switch(method) {
                    case "readWorkspace": io.execute(()-> readWorkspace(id)); break;
                    case "saveWorkspace": io.execute(()-> saveWorkspace(id,args)); break;
                    case "chooseFiles": runOnUiThread(()-> chooseFiles(id,"backup".equals(args.optString("kind")))); break;
                    case "exportFile": io.execute(()-> prepareExport(id,args)); break;
                    case "ready": runOnUiThread(()->{ready=true;reply(id,new JSONObject(),null);deliverPendingFiles();}); break;
                    case "setTheme": runOnUiThread(()->{setThemeColors(args.optString("theme"));reply(id,new JSONObject(),null);}); break;
                    default: reply(id,null,"不支持的操作");
                }
            } catch (Exception ignored) { /* Malformed requests have no side effects. */ }
        }
    }
    private AtomicFile workspaceFile() { return new AtomicFile(new File(getFilesDir(),"workspace.json")); }
    private void readWorkspace(String id) {
        try {
            AtomicFile file=workspaceFile();
            reply(id,new String(file.readFully(),StandardCharsets.UTF_8),null);
        } catch (FileNotFoundException e) { reply(id,JSONObject.NULL,null);
        } catch (Exception e) { reply(id,null,"本地数据读取失败，请保留应用数据并联系支持。"); }
    }
    private void saveWorkspace(String id,JSONObject payload) {
        AtomicFile file=workspaceFile(); FileOutputStream output=null;
        try {
            String data=payload.getString("data");
            JSONObject state=new JSONObject(data);
            if(state.getInt("version")!=1||state.optJSONArray("customLessons")==null||state.optJSONArray("attempts")==null||state.optJSONObject("words")==null)throw new IOException("Invalid data");
            byte[] bytes=data.getBytes(StandardCharsets.UTF_8);
            if(bytes.length>32*1024*1024)throw new IOException("Too large");
            output=file.startWrite();output.write(bytes);file.finishWrite(output);
            reply(id,new JSONObject().put("saved",true),null);
        } catch(Exception e){if(output!=null)file.failWrite(output);reply(id,null,"无法保存，请检查设备存储空间并导出备份。");}
    }
    private void reply(String id,Object result,String error) {
        try {
            String json=new JSONObject().put("id",id).put("ok",error==null).put("result",result==null?JSONObject.NULL:result).put("error",error==null?"":error).toString();
            runOnUiThread(()->{if(!isDestroyed())web.evaluateJavascript("window.__shiciReply("+json+")",null);});
        }catch(Exception ignored){}
    }
    private void chooseFiles(String id,boolean backup) {
        if(pickerRequest!=null){reply(id,null,"请先完成当前文件选择。");return;}
        pickerRequest=id;pickerBackup=backup;
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,false);
        try{startActivityForResult(intent,OPEN_FILES);}catch(ActivityNotFoundException e){pickerRequest=null;reply(id,null,"未找到系统文件选择器。");}
    }
    private JSONArray readUris(List<Uri> uris,boolean backup) throws Exception {
        JSONArray results=new JSONArray();
        for(Uri uri:uris){
            if(!"content".equals(uri.getScheme()))continue;
            String name="document";long size=-1;
            try(Cursor cursor=getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE},null,null,null)){
                if(cursor!=null&&cursor.moveToFirst()){name=cursor.getString(0);if(!cursor.isNull(1))size=cursor.getLong(1);}
            }
            if(name==null)name="document";
            String ext=name.contains(".")?name.substring(name.lastIndexOf('.')+1).toLowerCase(Locale.ROOT):"";
            if(!(backup?Arrays.asList("json"):Arrays.asList("pdf","md","markdown","txt","json")).contains(ext))throw new IOException("请选择 PDF、Markdown 或正确的 JSON 备份。");
            int limit=30*1024*1024;
            if(size>limit)throw new IOException("文件过大："+name);
            try(InputStream input=getContentResolver().openInputStream(uri);ByteArrayOutputStream buffer=new ByteArrayOutputStream()){
                if(input==null)throw new IOException("无法读取文件");
                byte[] chunk=new byte[32768];int count;
                while((count=input.read(chunk))!=-1){if(buffer.size()+count>limit)throw new IOException("文件过大："+name);buffer.write(chunk,0,count);}
                results.put(new JSONObject().put("name",name).put("data",Base64.encodeToString(buffer.toByteArray(),Base64.NO_WRAP)).put("type",ext.equals("pdf")?"application/pdf":"text/plain"));
            }
        }
        return results;
    }
    private void prepareExport(String id,JSONObject payload){
        try{
            byte[] bytes=Base64.decode(payload.getString("data"),Base64.DEFAULT);
            String name=new File(payload.getString("name")).getName();
            String type=payload.optString("type","application/octet-stream");
            runOnUiThread(()->{
                if(exportRequest!=null){reply(id,null,"请先完成当前导出。");return;}
                exportRequest=id;exportBytes=bytes;
                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(type).putExtra(Intent.EXTRA_TITLE,name);
                try{startActivityForResult(intent,SAVE_FILE);}catch(ActivityNotFoundException e){exportRequest=null;exportBytes=null;reply(id,null,"未找到系统保存窗口。");}
            });
        }catch(Exception e){reply(id,null,"导出数据无效。");}
    }
    private void setThemeColors(String theme){
        boolean dark="dark".equals(theme);
        int color=dark?Color.rgb(28,36,30):"paper".equals(theme)?Color.rgb(248,247,243):Color.rgb(248,247,243);
        root.setBackgroundColor(color);web.setBackgroundColor(color);
        getWindow().setStatusBarColor(color);getWindow().setNavigationBarColor(color);
        if(android.os.Build.VERSION.SDK_INT>=30&&getWindow().getInsetsController()!=null){int flags=android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;getWindow().getInsetsController().setSystemBarsAppearance(dark?0:flags,flags);}
        else{int flags=getWindow().getDecorView().getSystemUiVisibility();int light=View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;getWindow().getDecorView().setSystemUiVisibility(dark?flags&~light:flags|light);}
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==OPEN_FILES&&pickerRequest!=null){
            String id=pickerRequest;boolean backup=pickerBackup;pickerRequest=null;
            if(resultCode!=RESULT_OK||data==null){reply(id,new JSONArray(),null);return;}
            List<Uri> uris=new ArrayList<>();
            ClipData clip=data.getClipData();if(clip!=null)for(int i=0;i<clip.getItemCount();i++)uris.add(clip.getItemAt(i).getUri());else if(data.getData()!=null)uris.add(data.getData());
            io.execute(()->{try{reply(id,readUris(uris,backup),null);}catch(Exception e){reply(id,null,e.getMessage());}});
        }else if(requestCode==SAVE_FILE&&exportRequest!=null){
            String id=exportRequest;byte[] bytes=exportBytes;exportRequest=null;exportBytes=null;
            if(resultCode!=RESULT_OK||data==null||data.getData()==null){try{reply(id,new JSONObject().put("saved",false),null);}catch(Exception ignored){}return;}
            Uri target=data.getData();
            io.execute(()->{try(OutputStream output=getContentResolver().openOutputStream(target,"wt")){if(output==null)throw new IOException("无法打开目标文件");output.write(bytes);output.flush();reply(id,new JSONObject().put("saved",true),null);}catch(Exception e){reply(id,null,"保存失败，请选择其他位置后重试。");}});
        }
    }
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);collectIntent(intent);if(ready)deliverPendingFiles();}
    private void collectIntent(Intent intent){
        if(intent==null)return;String action=intent.getAction();
        if(Intent.ACTION_VIEW.equals(action)&&intent.getData()!=null)pendingFiles.add(intent.getData());
        else if(Intent.ACTION_SEND.equals(action)){Uri uri=intent.getParcelableExtra(Intent.EXTRA_STREAM);if(uri!=null)pendingFiles.add(uri);}
        else if(Intent.ACTION_SEND_MULTIPLE.equals(action)){ArrayList<Uri> uris=intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);if(uris!=null)pendingFiles.addAll(uris);}
    }
    private void deliverPendingFiles(){
        if(pendingFiles.isEmpty())return;List<Uri> uris=new ArrayList<>(pendingFiles);pendingFiles.clear();
        io.execute(()->{try{String json=readUris(uris,false).toString();runOnUiThread(()->web.evaluateJavascript("window.dispatchEvent(new CustomEvent('shici:files',{detail:"+json+"}))",null));}catch(Exception e){runOnUiThread(()->Toast.makeText(this,"无法导入："+e.getMessage(),Toast.LENGTH_LONG).show());}});
    }
    @Override public void onBackPressed(){
        web.evaluateJavascript("window.__shiciBack ? window.__shiciBack() : false",result->{if(!"true".equals(result)){web.evaluateJavascript("window.__shiciFlush && window.__shiciFlush()",null);moveTaskToBack(true);}});
    }
    @Override protected void onPause(){web.evaluateJavascript("window.__shiciFlush && window.__shiciFlush()",null);super.onPause();}
    @Override protected void onDestroy(){web.removeJavascriptInterface("ShiciHost");web.destroy();io.shutdown();super.onDestroy();}
}
