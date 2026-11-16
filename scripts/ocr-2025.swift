import Foundation
import AppKit
import Vision
let dir=URL(fileURLWithPath:CommandLine.arguments[1])
let files=try FileManager.default.contentsOfDirectory(at:dir,includingPropertiesForKeys:nil).filter{$0.pathExtension=="png"}.sorted{$0.path<$1.path}
for file in files {
 let output=file.deletingPathExtension().appendingPathExtension("json")
 if FileManager.default.fileExists(atPath:output.path) {continue}
 guard let ns=NSImage(contentsOf:file),let cg=ns.cgImage(forProposedRect:nil,context:nil,hints:nil) else {continue}
 let req=VNRecognizeTextRequest();req.recognitionLevel = .accurate;req.recognitionLanguages=["en-US"];req.usesLanguageCorrection=true;req.usesCPUOnly=true
 do { try VNImageRequestHandler(cgImage:cg).perform([req]) } catch { print(file.lastPathComponent, String(describing:error)); continue }
 let lines=(req.results ?? []).compactMap {o -> [String:Any]? in
  guard let t=o.topCandidates(1).first else {return nil}
  return ["text":t.string,"x":o.boundingBox.minX,"y":1-o.boundingBox.maxY,"w":o.boundingBox.width,"h":o.boundingBox.height,"confidence":t.confidence]
 }
 try JSONSerialization.data(withJSONObject:lines,options:[.prettyPrinted,.sortedKeys]).write(to:output)
 print(file.lastPathComponent,lines.count)
}
