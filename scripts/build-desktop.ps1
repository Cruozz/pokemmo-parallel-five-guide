param([switch]$SkipGuideChecks)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$taskRepo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskDesktop = Join-Path $taskRepo 'desktop-app'
$taskBuild = Join-Path $taskDesktop '.build'
$taskRelease = Join-Path $taskRepo 'release'
New-Item -ItemType Directory -Path $taskBuild, $taskRelease -Force | Out-Null

if (-not $SkipGuideChecks) {
    & node (Join-Path $PSScriptRoot 'check-guide.cjs')
    if ($LASTEXITCODE -ne 0) { throw '原攻略检查失败。' }
    & node (Join-Path $PSScriptRoot 'check-guide-editor.cjs')
    if ($LASTEXITCODE -ne 0) { throw '编辑功能检查失败。' }
}

# Official NuGet package, pinned to the inspected Microsoft-signed SDK.
$taskSdkVersion = '1.0.4258.31'
$taskSdkSha256 = '56F7F4B8BF9AEE4B8EFEFBBDD4F67D5F74EBD1B100ED0806DA71BF76AF481AA9'
$taskSdkZip = Join-Path $taskBuild "webview2-$taskSdkVersion.zip"
$taskSdk = Join-Path $taskBuild "sdk-$taskSdkVersion"
if (-not (Test-Path -LiteralPath $taskSdkZip)) {
    Invoke-WebRequest -Uri "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/$taskSdkVersion/microsoft.web.webview2.$taskSdkVersion.nupkg" -OutFile $taskSdkZip
}
if ((Get-FileHash -LiteralPath $taskSdkZip -Algorithm SHA256).Hash -ne $taskSdkSha256) { throw 'WebView2 SDK 校验失败。' }
if (-not (Test-Path -LiteralPath (Join-Path $taskSdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'))) {
    Expand-Archive -LiteralPath $taskSdkZip -DestinationPath $taskSdk -Force
}
$taskLoader = Join-Path $taskSdk 'runtimes/win-x64/native/WebView2Loader.dll'
$taskSignature = Get-AuthenticodeSignature -LiteralPath $taskLoader
if ($taskSignature.Status -ne 'Valid' -or $taskSignature.SignerCertificate.Subject -notmatch 'Microsoft Corporation') {
    throw 'WebView2 组件的微软签名检查失败。'
}

$taskPages = @('index.html', 'styles.css', 'guide-editor.css', 'data.js', 'detail-guides.js',
    'docx-screenshots.js', 'route-guides.js', 'key-shots.js', 'route-plans.js', 'step-visuals.js',
    'map-notes.js', 'step-visual-renderer.js', 'guide-edit-core.js', 'guide-editor.js', 'app.js',
    'image-markup-core.js', 'image-markup-editor.js', 'image-markup.css')
$taskInputs = New-Object 'System.Collections.Generic.List[object]'
foreach ($taskFile in $taskPages) {
    $taskPath = Join-Path $taskRepo $taskFile
    if (-not (Test-Path -LiteralPath $taskPath)) { throw "缺少攻略文件：$taskFile" }
    $taskInputs.Add([pscustomobject]@{ Source = $taskPath; Entry = "site/$taskFile" })
}
foreach ($taskFile in (Get-ChildItem -LiteralPath (Join-Path $taskRepo 'assets') -File -Recurse | Sort-Object FullName)) {
    $taskRelative = $taskFile.FullName.Substring($taskRepo.Length + 1).Replace('\', '/')
    $taskInputs.Add([pscustomobject]@{ Source = $taskFile.FullName; Entry = "site/$taskRelative" })
}
$taskInputs.Add([pscustomobject]@{ Source = (Join-Path $taskDesktop 'desktop-bridge.js'); Entry = 'site/desktop-bridge.js' })
foreach ($taskFile in @('Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.WinForms.dll')) {
    $taskInputs.Add([pscustomobject]@{ Source = (Join-Path $taskSdk "lib/net462/$taskFile"); Entry = "runtime/$taskFile" })
}
$taskInputs.Add([pscustomobject]@{ Source = $taskLoader; Entry = 'runtime/WebView2Loader.dll' })
foreach ($taskFile in @('LICENSE.txt', 'NOTICE.txt')) {
    $taskInputs.Add([pscustomobject]@{ Source = (Join-Path $taskSdk $taskFile); Entry = "licenses/WebView2-$taskFile" })
}

Add-Type -AssemblyName System.IO.Compression
$taskPayload = Join-Path $taskBuild 'guide.bundle.zip'
$taskStream = [IO.File]::Open($taskPayload, [IO.FileMode]::Create)
$taskArchive = New-Object IO.Compression.ZipArchive($taskStream, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($taskInput in $taskInputs) {
        $taskEntry = $taskArchive.CreateEntry($taskInput.Entry, [IO.Compression.CompressionLevel]::Optimal)
        # A fixed ZIP timestamp keeps identical source builds reproducible.
        $taskEntry.LastWriteTime = [DateTimeOffset]::Parse('2026-10-09T00:00:00+00:00')
        $taskOutput = $taskEntry.Open()
        $taskSource = [IO.File]::OpenRead($taskInput.Source)
        try { $taskSource.CopyTo($taskOutput) } finally { $taskSource.Dispose(); $taskOutput.Dispose() }
    }
} finally { $taskArchive.Dispose(); $taskStream.Dispose() }
$taskPayloadSha = (Get-FileHash -LiteralPath $taskPayload -Algorithm SHA256).Hash.ToLowerInvariant()
$taskBuildInfo = Join-Path $taskBuild 'BuildInfo.cs'
[IO.File]::WriteAllText($taskBuildInfo, ('namespace PokemmoGuideDesktop { internal static class BuildInfo { internal const string ContentId = "' + $taskPayloadSha.Substring(0, 20) + '"; internal const string PayloadSha256 = "' + $taskPayloadSha + '"; } }'), [Text.Encoding]::UTF8)

$taskCompiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path -LiteralPath $taskCompiler)) { throw '构建需要 Windows 的 .NET Framework C# 编译器。' }
$taskExe = Join-Path $taskRelease '平行五通攻略.exe'
$taskArgs = @('/nologo', '/target:winexe', '/platform:x64', '/optimize+', '/utf8output',
    "/out:$taskExe", "/win32manifest:$(Join-Path $taskDesktop 'app.manifest')", "/resource:$taskPayload,guide.bundle.zip",
    '/reference:System.dll', '/reference:System.Core.dll', '/reference:System.Windows.Forms.dll', '/reference:System.Drawing.dll',
    '/reference:System.IO.Compression.dll', '/reference:System.IO.Compression.FileSystem.dll', '/reference:System.Web.Extensions.dll',
    "/reference:$(Join-Path $taskSdk 'lib/net462/Microsoft.Web.WebView2.Core.dll')",
    "/reference:$(Join-Path $taskSdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll')",
    (Join-Path $taskDesktop 'Program.cs'), (Join-Path $taskDesktop 'GuideWindow.cs'), $taskBuildInfo)
& $taskCompiler @taskArgs
if ($LASTEXITCODE -ne 0) { throw 'Windows 程序编译失败。' }

$taskRecord = [ordered]@{
    version = '1.2.3'; buildDate = '2026-10-10'; architecture = 'x64'; sdkVersion = $taskSdkVersion
    sdkSource = "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/$taskSdkVersion/microsoft.web.webview2.$taskSdkVersion.nupkg"
    sdkSha256 = $taskSdkSha256.ToLowerInvariant(); payloadSha256 = $taskPayloadSha
    exeSha256 = (Get-FileHash -LiteralPath $taskExe -Algorithm SHA256).Hash.ToLowerInvariant()
    exeBytes = (Get-Item -LiteralPath $taskExe).Length; bundleFiles = $taskInputs.Count
    assetFiles = ($taskInputs | Where-Object { $_.Entry.StartsWith('site/assets/') } | Measure-Object).Count
    files = @($taskInputs | ForEach-Object { [ordered]@{ path = $_.Entry; bytes = (Get-Item -LiteralPath $_.Source).Length; sha256 = (Get-FileHash -LiteralPath $_.Source -Algorithm SHA256).Hash.ToLowerInvariant() } })
}
[IO.File]::WriteAllText((Join-Path $taskRelease '平行五通攻略-build.json'), ($taskRecord | ConvertTo-Json -Depth 5), [Text.Encoding]::UTF8)
Write-Output ("已生成：{0}（{1:N1} MB，{2} 个内置资源文件）" -f $taskExe, ((Get-Item -LiteralPath $taskExe).Length / 1MB), $taskInputs.Count)
