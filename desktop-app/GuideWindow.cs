using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace PokemmoGuideDesktop
{
    internal sealed class GuideWindow : Form
    {
        private const string Host = "pokemmo-guide.local";
        private const string Home = "https://pokemmo-guide.local/index.html";
        private readonly string contentRoot;
        private readonly string runtimeRoot;
        private readonly string initialUri;
        private readonly bool isMain;
        private readonly WebView2 view;
        private readonly Label loading;
        private CoreWebView2Environment environment;
        private TaskCompletionSource<bool> saveWaiter;
        private bool closing, allowClose;
        private string closeRequest;

        internal GuideWindow(string content, string runtime, string uri = Home, CoreWebView2Environment sharedEnvironment = null)
        {
            contentRoot = content; runtimeRoot = runtime; initialUri = uri;
            isMain = uri == Home; environment = sharedEnvironment;
            Text = isMain ? Program.Title : "图片 · " + Program.Title;
            StartPosition = FormStartPosition.CenterScreen;
            AutoScaleMode = AutoScaleMode.Dpi;
            MinimumSize = new Size(800, 600);
            Size = new Size(Math.Min(1280, Screen.PrimaryScreen.WorkingArea.Width), Math.Min(860, Screen.PrimaryScreen.WorkingArea.Height));
            BackColor = Color.White;
            view = new WebView2 { Dock = DockStyle.Fill };
            loading = new Label { Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleCenter,
                Font = new Font("Microsoft YaHei UI", 12), Text = "正在打开攻略…", ForeColor = Color.FromArgb(35, 63, 85) };
            Controls.Add(view); Controls.Add(loading);
            Shown += async delegate { await InitializeView(); };
            FormClosing += SaveBeforeClose;
            FormClosed += delegate { view.Dispose(); };
        }

        private async Task InitializeView()
        {
            try
            {
                if (environment == null)
                {
                    CoreWebView2Environment.SetLoaderDllFolderPath(runtimeRoot);
                    environment = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Program.DataRoot, "profile"));
                }
                await view.EnsureCoreWebView2Async(environment);
                if (IsDisposed) return;
                var core = view.CoreWebView2;
                core.SetVirtualHostNameToFolderMapping(Host, Path.Combine(contentRoot, "site"), CoreWebView2HostResourceAccessKind.DenyCors);
                core.Settings.AreDefaultContextMenusEnabled = true;
                core.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs e)
                {
                    if (IsLocal(e.Uri) || e.Uri == "about:blank" || (!isMain && IsImageData(e.Uri))) return;
                    e.Cancel = true; OpenExternal(e.Uri);
                };
                core.NewWindowRequested += delegate(object sender, CoreWebView2NewWindowRequestedEventArgs e)
                {
                    e.Handled = true;
                    if (IsLocal(e.Uri) || IsImageData(e.Uri))
                        new GuideWindow(contentRoot, runtimeRoot, e.Uri, environment).Show(this);
                    else OpenExternal(e.Uri);
                };
                core.DownloadStarting += DownloadBackup;
                core.WebMessageReceived += ReceiveMessage;
                // The bridge waits for IndexedDB writes before allowing the native window to close.
                string bridge = File.ReadAllText(Path.Combine(contentRoot, "site", "desktop-bridge.js"));
                await core.AddScriptToExecuteOnDocumentCreatedAsync(bridge);
                core.NavigationCompleted += delegate(object sender, CoreWebView2NavigationCompletedEventArgs e)
                {
                    loading.Visible = false;
                    if (!e.IsSuccess && !IsDisposed)
                        MessageBox.Show(this, "页面加载失败，请重新打开程序。", Program.Title, MessageBoxButtons.OK, MessageBoxIcon.Error);
                };
                core.Navigate(initialUri);
            }
            catch (WebView2RuntimeNotFoundException)
            {
                loading.Text = "这台电脑缺少 Microsoft Edge WebView2 运行时。";
                if (MessageBox.Show(this, "请先安装微软 WebView2 运行时，再打开攻略。\n是否打开微软官方下载页面？",
                    Program.Title, MessageBoxButtons.YesNo, MessageBoxIcon.Information) == DialogResult.Yes)
                    OpenExternal("https://developer.microsoft.com/microsoft-edge/webview2/");
            }
            catch (Exception error)
            {
                if (IsDisposed) return;
                loading.Text = "攻略打开失败，请重新打开程序。";
                Directory.CreateDirectory(Program.DataRoot);
                File.WriteAllText(Path.Combine(Program.DataRoot, "startup-error.txt"), error.ToString());
                MessageBox.Show(this, "打开失败：" + error.Message, Program.Title, MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static bool IsLocal(string value)
        {
            Uri uri;
            return Uri.TryCreate(value, UriKind.Absolute, out uri) && uri.Scheme == "https" && uri.Host == Host && uri.IsDefaultPort;
        }

        private static bool IsImageData(string value)
        {
            return value.StartsWith("data:image/png;base64,", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("data:image/jpeg;base64,", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("data:image/webp;base64,", StringComparison.OrdinalIgnoreCase);
        }

        private static void OpenExternal(string value)
        {
            Uri uri;
            if (!Uri.TryCreate(value, UriKind.Absolute, out uri) || (uri.Scheme != "https" && uri.Scheme != "http")) return;
            try { Process.Start(new ProcessStartInfo(value) { UseShellExecute = true }); }
            catch { MessageBox.Show("无法打开浏览器，请手动查看：\n" + value, Program.Title); }
        }

        private void DownloadBackup(object sender, CoreWebView2DownloadStartingEventArgs e)
        {
            // Defer the event so the WinForms save dialog does not block WebView2's callback stack.
            if (!IsLocal(view.CoreWebView2.Source)) return;
            var deferral = e.GetDeferral();
            e.Handled = true;
            BeginInvoke(new Action(delegate
            {
                try
                {
                    using (var save = new SaveFileDialog())
                    {
                        save.Title = "保存攻略备份";
                        save.Filter = "攻略备份 (*.json)|*.json";
                        save.DefaultExt = "json";
                        save.AddExtension = true;
                        save.FileName = "平行五通-攻略备份-" + DateTime.Now.ToString("yyyy-MM-dd") + ".json";
                        if (save.ShowDialog(this) == DialogResult.OK) e.ResultFilePath = save.FileName;
                        else e.Cancel = true;
                    }
                }
                finally { deferral.Complete(); }
            }));
        }

        private void ReceiveMessage(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            if (!IsLocal(e.Source)) return;
            try
            {
                var value = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(e.WebMessageAsJson);
                object type, request, ok;
                if (value.TryGetValue("type", out type) && (string)type == "save-complete"
                    && value.TryGetValue("request", out request) && (string)request == closeRequest
                    && value.TryGetValue("ok", out ok) && saveWaiter != null)
                    saveWaiter.TrySetResult(ok is bool && (bool)ok);
            }
            catch { /* Ignore unrelated page messages. */ }
        }

        private async void SaveBeforeClose(object sender, FormClosingEventArgs e)
        {
            if (allowClose || !isMain || view.CoreWebView2 == null || !IsLocal(view.CoreWebView2.Source)) return;
            e.Cancel = true;
            if (closing) return;
            closing = true;
            try
            {
                closeRequest = Guid.NewGuid().ToString("N");
                saveWaiter = new TaskCompletionSource<bool>();
                view.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(
                    new { type = "save-before-close", request = closeRequest }));
                var result = await Task.WhenAny(saveWaiter.Task, Task.Delay(8000));
                bool saved = result == saveWaiter.Task && await saveWaiter.Task;
                if (!saved && MessageBox.Show(this, "有些修改未能保存。建议先取消关闭，在页面中导出备份。\n仍然关闭程序吗？",
                    Program.Title, MessageBoxButtons.YesNo, MessageBoxIcon.Warning) != DialogResult.Yes) return;
                allowClose = true;
                BeginInvoke(new Action(Close));
            }
            catch (Exception error)
            {
                File.WriteAllText(Path.Combine(Program.DataRoot, "close-error.txt"), error.ToString());
                if (MessageBox.Show(this, "保存时遇到问题。建议先取消关闭并导出备份。\n仍然关闭程序吗？",
                    Program.Title, MessageBoxButtons.YesNo, MessageBoxIcon.Warning) == DialogResult.Yes)
                { allowClose = true; BeginInvoke(new Action(Close)); }
            }
            finally { closing = false; }
        }
    }
}
