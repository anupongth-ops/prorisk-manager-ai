$pptxPath = "D:\Apps\epopm\prorisk-manager-ai\ProRisk_Manager_AI_User_Guide.pptx"
$outDir = "D:\Apps\epopm\prorisk-manager-ai\scratch\slide_previews"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$ppt = New-Object -ComObject PowerPoint.Application
try {
    $pres = $ppt.Presentations.Open($pptxPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    $slideNum = 1
    foreach ($slide in $pres.Slides) {
        $outFile = Join-Path $outDir ("slide_" + $slideNum + ".png")
        $slide.Export($outFile, "PNG", 1920, 1080)
        Write-Host "Exported slide $slideNum to $outFile"
        $slideNum++
    }
    $pres.Close()
} finally {
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
    [System.GC]::Collect()
}
