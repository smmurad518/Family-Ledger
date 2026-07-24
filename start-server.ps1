# Dynamic local web server for static files & REST API sync

$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

$dbFile = Join-Path (Get-Location) "db_store.json"
$serverVersion = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

try {
    $listener.Start()
} catch {
    Write-Host "Failed to start HttpListener: $_" -ForegroundColor Red
    exit
}

Write-Host "--------------------------------------------------------" -ForegroundColor Green
Write-Host " M&M Family Ledger Local Web Server Running!" -ForegroundColor Green
Write-Host " Local URL   : http://localhost:$port/" -ForegroundColor Cyan
Write-Host " Sync API    : http://localhost:$port/api/sync" -ForegroundColor Cyan
Write-Host " Version API : http://localhost:$port/api/version" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Green

try {
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $urlPath = $request.Url.LocalPath
            Write-Host "$(Get-Date -Format 'HH:mm:ss') - $($request.HttpMethod) $($urlPath)" -ForegroundColor Gray
            
            # API Version Endpoint
            if ($urlPath -eq "/api/version") {
                $response.ContentType = "application/json; charset=utf-8"
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
                $verJson = "{`"version`": $serverVersion}"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($verJson)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }
            
            # API Sync Endpoint
            if ($urlPath -eq "/api/sync") {
                $response.ContentType = "application/json; charset=utf-8"
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
                $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                
                if ($request.HttpMethod -eq "OPTIONS") {
                    $response.StatusCode = 200
                    $response.Close()
                    continue
                }

                if ($request.HttpMethod -eq "POST") {
                    $encoding = if ($request.ContentEncoding) { $request.ContentEncoding } else { [System.Text.Encoding]::UTF8 }
                    $reader = New-Object System.IO.StreamReader($request.InputStream, $encoding)
                    $body = $reader.ReadToEnd()
                    if (![string]::IsNullOrWhiteSpace($body)) {
                        try {
                            $parsed = $body | ConvertFrom-Json
                            if ($parsed) {
                                [System.IO.File]::WriteAllText($dbFile, $body, [System.Text.Encoding]::UTF8)
                            }
                        } catch {}
                    }
                }

                $content = '{"shopping":[],"expenses":[],"dues":[],"updatedAt":0}'
                if (Test-Path $dbFile) {
                    $readContent = [System.IO.File]::ReadAllText($dbFile, [System.Text.Encoding]::UTF8)
                    if (![string]::IsNullOrWhiteSpace($readContent)) {
                        $content = $readContent
                    }
                }
                
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }
            
            # Static File Serving
            if ($urlPath -eq "/" -or $urlPath -eq "") {
                $urlPath = "/index.html"
            }
            
            $cleanPath = [System.Uri]::UnescapeDataString($urlPath.TrimStart('/')).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $localFile = Join-Path (Get-Location) $cleanPath
            
            if (Test-Path $localFile -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($localFile).ToLower()
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".svg"  { "image/svg+xml" }
                    ".ico"  { "image/x-icon" }
                    default { "application/octet-stream" }
                }
                
                $bytes = [System.IO.File]::ReadAllBytes($localFile)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                if ($ext -eq ".html" -or $ext -eq ".js" -or $ext -eq ".css") {
                    $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
                }
                
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 404
                $htmlBytes = [System.Text.Encoding]::UTF8.GetBytes("<h3>404 Not Found</h3><p>File not found: $urlPath</p>")
                $response.ContentType = "text/html; charset=utf-8"
                $response.ContentLength64 = $htmlBytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($htmlBytes, 0, $htmlBytes.Length)
                }
            }
            $response.Close()
        } catch {
            if ($response) { try { $response.Close() } catch {} }
        }
    }
} catch {
    Write-Host "`nServer stopped." -ForegroundColor Yellow
} finally {
    try { $listener.Stop(); $listener.Close() } catch {}
}
