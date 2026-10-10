using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("平行五通攻略")]
[assembly: AssemblyDescription("PokeMMO 五地区攻略与图文流程编辑")]
[assembly: AssemblyProduct("平行五通攻略")]
[assembly: AssemblyVersion("1.2.3.0")]
[assembly: AssemblyFileVersion("1.2.3.0")]

namespace PokemmoGuideDesktop
{
    internal static class Program
    {
        internal const string Title = "平行五通攻略";
        internal static readonly string DataRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PokeMMOParallelFiveGuide");

        [STAThread]
        private static void Main(string[] args)
        {
            // Extraction-only mode checks packaging without opening or touching the editing profile.
            bool extractOnly = args.Length == 2 && args[0] == "--extract-only";
            bool created;
            using (var singleInstance = new Mutex(true, "Local\\PokeMMOParallelFiveGuide.Desktop", out created))
            {
                if (!created && !extractOnly)
                {
                    IntPtr handle = FindWindow(null, Title);
                    if (handle != IntPtr.Zero) { ShowWindow(handle, 9); SetForegroundWindow(handle); }
                    return;
                }
                try
                {
                    string content = PrepareBundle();
                    if (extractOnly) { File.WriteAllText(args[1], content, System.Text.Encoding.UTF8); return; }
                    string runtime = Path.Combine(content, "runtime");
                    AppDomain.CurrentDomain.AssemblyResolve += delegate(object sender, ResolveEventArgs e)
                    {
                        string name = new AssemblyName(e.Name).Name;
                        if (name != "Microsoft.Web.WebView2.Core" && name != "Microsoft.Web.WebView2.WinForms") return null;
                        return Assembly.LoadFrom(Path.Combine(runtime, name + ".dll"));
                    };
                    Application.EnableVisualStyles();
                    Application.SetCompatibleTextRenderingDefault(false);
                    RunWindow(content, runtime);
                }
                catch (Exception error)
                {
                    Directory.CreateDirectory(DataRoot);
                    File.WriteAllText(Path.Combine(DataRoot, "startup-error.txt"), error.ToString());
                    if (extractOnly) { Environment.ExitCode = 1; return; }
                    MessageBox.Show("攻略暂时无法打开。请查看数据文件夹中的 startup-error.txt。\n\n" + error.Message,
                        Title, MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static void RunWindow(string content, string runtime)
        {
            Application.Run(new GuideWindow(content, runtime));
        }

        private static string PrepareBundle()
        {
            string folder = Path.Combine(DataRoot, "content", BuildInfo.ContentId);
            string marker = Path.Combine(folder, ".complete");
            string[] required = { "site/index.html", "site/guide-editor.js", "site/app.js",
                "runtime/Microsoft.Web.WebView2.Core.dll", "runtime/Microsoft.Web.WebView2.WinForms.dll", "runtime/WebView2Loader.dll" };
            bool complete = File.Exists(marker);
            foreach (string file in required) complete = complete && File.Exists(Path.Combine(folder, file));
            if (complete) return folder;

            Directory.CreateDirectory(folder);
            string root = Path.GetFullPath(folder) + Path.DirectorySeparatorChar;
            using (Stream payload = Assembly.GetExecutingAssembly().GetManifestResourceStream("guide.bundle.zip"))
            {
                if (payload == null) throw new InvalidDataException("程序中的攻略资源缺失。");
                using (var hash = SHA256.Create())
                {
                    string actual = BitConverter.ToString(hash.ComputeHash(payload)).Replace("-", "").ToLowerInvariant();
                    if (actual != BuildInfo.PayloadSha256) throw new InvalidDataException("攻略资源校验失败，请重新复制 exe。");
                }
                payload.Position = 0;
                using (var archive = new ZipArchive(payload, ZipArchiveMode.Read))
                {
                    foreach (var entry in archive.Entries)
                    {
                        string target = Path.GetFullPath(Path.Combine(folder, entry.FullName.Replace('/', Path.DirectorySeparatorChar)));
                        if (!target.StartsWith(root, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("资源路径不正确。");
                        if (entry.FullName.EndsWith("/")) { Directory.CreateDirectory(target); continue; }
                        Directory.CreateDirectory(Path.GetDirectoryName(target));
                        using (var input = entry.Open())
                        using (var output = File.Create(target)) input.CopyTo(output);
                    }
                }
            }
            File.WriteAllText(marker, BuildInfo.PayloadSha256);
            return folder;
        }

        [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern IntPtr FindWindow(string className, string title);
        [DllImport("user32.dll")] private static extern bool ShowWindow(IntPtr handle, int command);
        [DllImport("user32.dll")] private static extern bool SetForegroundWindow(IntPtr handle);
    }
}
